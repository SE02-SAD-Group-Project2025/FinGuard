# AIModel.py
import os
import logging
import warnings
from functools import lru_cache
from datetime import datetime
import json
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error

import joblib

warnings.filterwarnings("ignore")


def generate_local_llm_response(prompt: str, model: str = "llama3", host: str = "http://localhost:11434"):
    """
    Talk to Ollama locally (no extra import needed on your side).
    """
    try:
        import requests
        resp = requests.post(
            f"{host}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=30
        )
        if resp.ok:
            return resp.json().get("response", "").strip() or "No response from LLM."
        return f"LLM error: {resp.status_code} {resp.text}"
    except Exception as e:
        return f"LLM not reachable: {e}"


class PersonalizedBudgetRecommender:
    """
    Monthly-aggregate recommender (single or family).
    - Input: monthly totals (one row per month for single, or per member+month for family).
    - Models: RandomForest regressors for total / essential / discretionary.
    - Forecasts: next month & next week (with nuanced weekly profile).
    - LLaMA (Ollama) friendly summary helper included.
    """

    DEFAULT_CONFIG = {
        # Objectives & preprocessing
        "target_savings_rate": 0.20,
        "outlier_threshold": 1.5,
        "default_currency": "LKR",
        "min_months_for_training": 3,

        # Categories
        "essential_categories": ["rent", "food", "utilities", "transport"],
        "non_adjustable_categories": ["rent", "insurance", "loan_payment", "education"],

        # Family plan
        "account_type": "single",      # 'single' | 'family'
        "shared_credit_limit": None,   # monthly cap
        "member_min_floor_pct": 0.15,  # min % of member’s discretionary kept
        "member_role_weights": {
            "Adult": 1.0,
            "Child": 0.6,
            "Dependent": 0.8,
        },

        # Weekly analytics
        "weeks_per_month": 4.3,  # kept for simple splits & UI display
    }

    def __init__(self, config=None):
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        self.logger = self._setup_logger()

        # Runtime holders
        self.df = None                        # raw normalized input (monthly granularity)
        self.household_monthly = None         # household-per-month (aggregated)
        self.weekly_estimates = None          # household weekly splits (derived)
        self.models = {}
        self.scalers = {}
        self.recommendations = {}

        self.currency = self.config.get("default_currency", "LKR")
        self.currency_suffix = f"_{self.currency.lower()}"
        self.account_type = self.config.get("account_type", "single")

    # --------------------------------------------------------- #
    # Logger
    # --------------------------------------------------------- #
    def _setup_logger(self):
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)

    # --------------------------------------------------------- #
    # DATA LOADING (monthly inputs)
    # --------------------------------------------------------- #
    def load_and_prepare_data(self, data_or_path, user_profile=None):
        """
        Load **monthly** expense and income data.
        Accepts either a CSV path or a pandas DataFrame.

        Expected columns (single account):
          - month_num (1..12)
          - income_lkr
          - <category>_lkr (rent_lkr, food_lkr, utilities_lkr, transport_lkr, ...)

        Family (optional):
          - member_id (e.g., M1, M2)
          - member_role (Adult|Child|Dependent)
        """
        # Load
        if isinstance(data_or_path, pd.DataFrame):
            df = data_or_path.copy()
        else:
            path = str(data_or_path)
            if not os.path.exists(path):
                raise ValueError("Invalid file path")
            if not path.lower().endswith(".csv"):
                raise ValueError("Only CSV files are supported")
            self.logger.info(f"Loading data from {path}")
            df = pd.read_csv(path)

        # month_num required
        if "month_num" not in df.columns:
            if "month" in df.columns and pd.api.types.is_integer_dtype(df["month"]):
                df = df.rename(columns={"month": "month_num"})
            else:
                raise ValueError("CSV/DataFrame must include an integer 'month_num' column (1..12).")

        # Require income, coerce numeric category columns
        required = ["month_num", f"income{self.currency_suffix}"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        # Normalize family columns
        if self.account_type == "family":
            if "member_id" not in df.columns:
                self.logger.warning("Family account without 'member_id'; treating as one household row per month.")
                df["member_id"] = "H1"
            if "member_role" not in df.columns:
                df["member_role"] = "Adult"
            df["member_role"] = df["member_role"].fillna("Adult").astype(str)
        else:
            df["member_id"] = "H1"
            df["member_role"] = "Adult"

        # Money columns
        income_col = f"income{self.currency_suffix}"
        money_cols = [c for c in df.columns if c.endswith(self.currency_suffix)]
        if income_col not in money_cols:
            raise ValueError(f"Missing '{income_col}' column.")
        expense_cols = [c for c in money_cols if c != income_col]
        if not expense_cols:
            raise ValueError(f"No expense columns ending with '{self.currency_suffix}' (besides income).")

        # Coerce numeric for all *_lkr columns
        num_cols = [c for c in df.columns if c.endswith(self.currency_suffix)]
        df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0)

        # Totals per row
        df["total_monthly_expenses"] = df[expense_cols].sum(axis=1)
        ess_mask_cols = [c for c in expense_cols if any(k in c for k in self.config["essential_categories"])]
        df["essential_expenses"] = df[ess_mask_cols].sum(axis=1) if ess_mask_cols else 0.0
        df["non_essential_expenses"] = df["total_monthly_expenses"] - df["essential_expenses"]

        # Savings per row
        df["monthly_savings"] = df[income_col] - df["total_monthly_expenses"]
        df["savings_rate"] = np.where(df[income_col] > 0, df["monthly_savings"] / df[income_col], 0.0)

        # Outliers on total expenses
        Q1 = df["total_monthly_expenses"].quantile(0.25)
        Q3 = df["total_monthly_expenses"].quantile(0.75)
        IQR = Q3 - Q1
        t = self.config["outlier_threshold"]
        df["is_outlier"] = (
            (df["total_monthly_expenses"] < (Q1 - t * IQR)) |
            (df["total_monthly_expenses"] > (Q3 + t * IQR))
        ).astype(int)

        # Canonical columns for compatibility
        current_year = datetime.now().year
        df["date"] = pd.to_datetime(df["month_num"].apply(lambda m: f"{current_year}-{int(m):02d}-01"))
        df["day_of_month"] = 1
        df["day_of_week"] = df["date"].dt.day_name()
        df["is_weekend"] = df["date"].dt.weekday >= 5

        # Dummy “7day” fields for historical compat
        df["7day_expense_avg"] = df["total_monthly_expenses"] / 30.0
        df["7day_expense_std"] = 0.0

        # Persist raw
        self.df = df.copy()

        # Household monthly aggregate
        self.household_monthly = (
            df.groupby("month_num")[[income_col, "total_monthly_expenses", "essential_expenses", "non_essential_expenses"] + expense_cols]
              .sum()
              .sort_index()
        )

        # Ratios at household level
        hm = self.household_monthly
        hm["essential_ratio"] = np.where(hm["total_monthly_expenses"] > 0, hm["essential_expenses"] / hm["total_monthly_expenses"], 0.0)
        hm["discretionary_ratio"] = np.where(hm["total_monthly_expenses"] > 0, hm["non_essential_expenses"] / hm["total_monthly_expenses"], 0.0)

        # Weekly estimates (simple uniform split for reference/compat)
        weeks = float(self.config["weeks_per_month"])
        self.weekly_estimates = pd.DataFrame(
            {f"weekly_{col}": hm[col] / weeks for col in [income_col] + expense_cols},
            index=hm.index
        )

        # Training length note (data is provided by backend; just warn)
        if hm.shape[0] < self.config["min_months_for_training"]:
            self.logger.warning(
                f"Only {hm.shape[0]} month(s) present; training is best with >= {self.config['min_months_for_training']} months."
            )

        self.logger.info(f"Data loaded successfully. Shape: {self.df.shape}")
        return self.df

    # --------------------------------------------------------- #
    # ANALYSIS (cached)
    # --------------------------------------------------------- #
    @lru_cache(maxsize=1)
    def analyze_spending_patterns(self):
        if self.df is None:
            raise ValueError("Data not loaded. Call load_and_prepare_data first.")
        income_col = f"income{self.currency_suffix}"
        expense_cols = [c for c in self.df.columns if c.endswith(self.currency_suffix) and c != income_col]

        category_totals = self.df[expense_cols].sum().sort_values(ascending=False)
        analysis = {
            "monthly_stats": self.household_monthly.copy(),
            "category_breakdown": category_totals,
            "savings_analysis": {
                "mean_savings_rate": float(self.df["savings_rate"].mean()),
                "months_negative_savings": int((self.df["monthly_savings"] < 0).sum()),
            },
            "weekly_estimates": self.weekly_estimates.copy(),
        }
        return analysis

    # --------------------------------------------------------- #
    # MODEL BUILDING (month-level)
    # --------------------------------------------------------- #
    def build_predictive_models(self):
        if self.df is None:
            raise ValueError("Data not loaded. Call load_and_prepare_data first.")

        hm = self.household_monthly.reset_index()  # month_num as a column

        # Time features for robustness on short history
        hm["lag1_total"] = hm["total_monthly_expenses"].shift(1).fillna(hm["total_monthly_expenses"].mean())
        hm["roll3_total"] = hm["total_monthly_expenses"].rolling(3).mean().fillna(hm["total_monthly_expenses"].mean())

        if len(hm) < self.config["min_months_for_training"]:
            self.logger.warning(
                f"Only {len(hm)} months of data available for training. "
                f"Forecast accuracy may be lower; using baseline blending."
            )

        feature_cols = ["month_num", "essential_ratio", "discretionary_ratio", "lag1_total", "roll3_total"]
        X = hm[feature_cols].copy()

        targets = {
            "total_expenses": hm["total_monthly_expenses"].values,
            "essential_expenses": hm["essential_expenses"].values,
            "discretionary_expenses": hm["non_essential_expenses"].values,
        }

        for name, y in targets.items():
            # split (fallback to fit-on-all if very small)
            if len(hm) >= 4:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
            else:
                X_train = X.copy(); y_train = y.copy()
                X_test = X.copy();  y_test = y.copy()

            scaler = StandardScaler()
            X_train_sc = scaler.fit_transform(X_train)
            X_test_sc  = scaler.transform(X_test)

            model = RandomForestRegressor(n_estimators=120, random_state=42)
            model.fit(X_train_sc, y_train)
            y_pred = model.predict(X_test_sc)
            r2 = float(r2_score(y_test, y_pred)) if len(np.unique(y_test)) > 1 else 0.0
            mae = float(mean_absolute_error(y_test, y_pred))

            self.models[name] = {
                "model": model,
                "scaler": scaler,
                "features": feature_cols,
                "r2_score": r2,
                "mae": mae,
            }
            self.logger.info(f"{name} model - R² Score: {r2:.3f}, MAE: {mae:.2f}")

    # --------------------------------------------------------- #
    # PREDICT: next week / next month (with nuanced weekly profile)
    # --------------------------------------------------------- #
    def predict_budget(self, horizon="month"):
        """
        Predict household totals for the next period using latest ratios + time features.
        horizon: 'week' | 'month'
        Returns dict with point prediction and low/high bands (± MAE).
        For 'week', returns a profiled weekly_breakdown (essentials flatter; discretionary higher at month-end).
        """
        if not self.models:
            raise ValueError("Models not trained. Call build_predictive_models first.")
        if self.household_monthly is None or self.household_monthly.empty:
            raise ValueError("No monthly data available.")

        hm = self.household_monthly.copy()
        last_month = int(hm.index.max())
        next_month = 1 if last_month == 12 else last_month + 1

        # Build features for next month
        hm_sorted = hm.sort_index()
        totals = hm_sorted["total_monthly_expenses"]

        if len(totals) == 1:
            lag1_total = float(totals.iloc[-1])
            roll3_total = float(totals.iloc[-1])
        else:
            lag1_total = float(totals.iloc[-1])
            roll3_total = float(totals.tail(min(3, len(totals))).mean())

        last_row = hm_sorted.iloc[-1]
        essential_ratio = float(last_row.get("essential_ratio", 0.0))
        discretionary_ratio = float(last_row.get("discretionary_ratio", 0.0))

        feat = pd.DataFrame([{
            "month_num": next_month,
            "essential_ratio": essential_ratio,
            "discretionary_ratio": discretionary_ratio,
            "lag1_total": lag1_total,
            "roll3_total": roll3_total,
        }])

        def _predict_with_band(target_key: str, default_value: float):
            if target_key not in self.models:
                pred = default_value
                err = 0.0
                return pred, max(0.0, pred - err), pred + err
            info = self.models[target_key]
            X_sc = info["scaler"].transform(feat[info["features"]])
            pred = float(info["model"].predict(X_sc)[0])
            err = float(info.get("mae", 0.0))
            return pred, max(0.0, pred - err), pred + err

        # Predict monthly first
        pred_total_m, low_total_m, high_total_m = _predict_with_band(
            "total_expenses",
            default_value=float(last_row["total_monthly_expenses"])
        )
        pred_ess_m, low_ess_m, high_ess_m = _predict_with_band(
            "essential_expenses",
            default_value=float(last_row["essential_expenses"])
        )
        pred_disc_m, low_disc_m, high_disc_m = _predict_with_band(
            "discretionary_expenses",
            default_value=float(last_row["non_essential_expenses"])
        )

        if horizon == "month":
            return {
                "horizon": "month",
                "predicted_expenses": max(0.0, pred_total_m),
                "predicted_essential": max(0.0, pred_ess_m),
                "predicted_discretionary": max(0.0, pred_disc_m),
                "low": max(0.0, low_total_m),
                "high": max(0.0, high_total_m),
                "essential_low": max(0.0, low_ess_m),
                "essential_high": max(0.0, high_ess_m),
                "discretionary_low": max(0.0, low_disc_m),
                "discretionary_high": max(0.0, high_disc_m),
            }

        elif horizon == "week":
            # --- Nuanced weekly profile (4-week default) ---
            # Essentials flatter, discretionary higher at month-end
            w_ess = np.array([0.25, 0.25, 0.25, 0.25])
            w_disc = np.array([0.23, 0.24, 0.24, 0.29])
            # Normalize (in case someone tweaks numbers)
            w_ess = w_ess / w_ess.sum()
            w_disc = w_disc / w_disc.sum()

            weekly_ess = (pred_ess_m * w_ess).tolist()
            weekly_disc = (pred_disc_m * w_disc).tolist()
            weekly_total = (np.array(weekly_ess) + np.array(weekly_disc)).tolist()

            # Distribute low/high bands proportionally
            weekly_ess_low  = (low_ess_m  * w_ess).tolist()
            weekly_ess_high = (high_ess_m * w_ess).tolist()
            weekly_disc_low  = (low_disc_m  * w_disc).tolist()
            weekly_disc_high = (high_disc_m * w_disc).tolist()
            weekly_total_low  = (np.array(weekly_ess_low)  + np.array(weekly_disc_low)).tolist()
            weekly_total_high = (np.array(weekly_ess_high) + np.array(weekly_disc_high)).tolist()

            return {
                "horizon": "week",
                "estimated": True,  # tell the UI this is a profiled estimate
                "predicted_expenses": float(np.sum(weekly_total)),
                "predicted_essential": float(np.sum(weekly_ess)),
                "predicted_discretionary": float(np.sum(weekly_disc)),
                "weekly_breakdown": {
                    "total": [float(x) for x in weekly_total],
                    "essential": [float(x) for x in weekly_ess],
                    "discretionary": [float(x) for x in weekly_disc],
                    "total_low": [float(x) for x in weekly_total_low],
                    "total_high": [float(x) for x in weekly_total_high],
                },
            }

        else:
            raise ValueError("horizon must be 'week' or 'month'")

    # --------------------------------------------------------- #
    # ONE-MONTH RECOMMENDATIONS
    # --------------------------------------------------------- #
    def generate_recommendations(self, target_savings_rate=None, month="latest"):
        if self.df is None:
            raise ValueError("Data not loaded. Call load_and_prepare_data first.")
        if target_savings_rate is None:
            target_savings_rate = float(self.config["target_savings_rate"])

        income_col = f"income{self.currency_suffix}"
        # Pick month
        sel_month = int(self.df["month_num"].max()) if month == "latest" else int(month)
        if sel_month not in self.household_monthly.index:
            raise ValueError(f"No data for month_num={sel_month}. Available: {list(self.household_monthly.index)}")

        hm_row = self.household_monthly.loc[sel_month]
        expense_cols = [c for c in self.household_monthly.columns if c.endswith(self.currency_suffix) and c != income_col]

        monthly_income = float(hm_row.get(income_col, 0.0))
        monthly_expenses = float(hm_row["total_monthly_expenses"])
        current_savings_rate = ((monthly_income - monthly_expenses) / monthly_income) if monthly_income > 0 else 0.0

        # Envelope target
        target_monthly_expenses = monthly_income * (1 - target_savings_rate) if monthly_income > 0 else monthly_expenses * 0.90
        reduction_needed = max(0.0, monthly_expenses - target_monthly_expenses)

        # Optional cap
        cap = self.config.get("shared_credit_limit")
        if cap is not None:
            reduction_needed = max(reduction_needed, max(0.0, monthly_expenses - float(cap)))

        # Opportunities
        cat_totals = hm_row[expense_cols].copy()
        total_exp = float(cat_totals.sum())
        opportunities = []
        if total_exp > 0:
            for category, amount in cat_totals.sort_values(ascending=False).head(8).items():
                amt = float(amount)
                pct = (amt / total_exp) * 100.0
                cname = category.replace(self.currency_suffix, "").replace("_", " ").title()
                lower = category.lower()
                if (
                    pct > 12.5 and
                    not any(ess in lower for ess in self.config["essential_categories"]) and
                    not any(na in lower for na in self.config["non_adjustable_categories"])
                ):
                    red = amt * 0.20
                    opportunities.append({
                        "category": cname,
                        "current_spending": amt,
                        "percentage_of_total": pct,
                        "suggested_reduction": red,
                        "potential_monthly_savings": red,
                    })

        rec = {
            "current_situation": {
                "month_num": sel_month,
                "avg_monthly_expenses": monthly_expenses,
                "avg_monthly_income": monthly_income,
                "current_savings_rate": current_savings_rate,
                "target_savings_rate": float(target_savings_rate),
                "num_months_data": 1,
            },
            "optimization_opportunities": opportunities,
            "monthly_budget_plan": {},
            "actionable_steps": [],
        }

        # SINGLE plan
        if self.account_type != "family" or "member_id" not in self.df.columns:
            plan = {}
            disc_factor = min(0.3, reduction_needed / (monthly_expenses + 1e-6)) if monthly_expenses > 0 else 0.0
            for category, month_amount in cat_totals.items():
                amt = float(month_amount)
                cname = category.replace(self.currency_suffix, "").replace("_", " ").title()
                lower = category.lower()

                if any(na in lower for na in self.config["non_adjustable_categories"]):
                    entry = {"current": amt, "recommended": amt, "reduction": 0.0, "priority": "Non-adjustable"}
                elif any(ess in lower for ess in self.config["essential_categories"]):
                    rec_amt = amt * 0.95
                    entry = {"current": amt, "recommended": rec_amt, "reduction": amt - rec_amt, "priority": "Low"}
                else:
                    rec_amt = amt * (1 - disc_factor)
                    entry = {"current": amt, "recommended": rec_amt, "reduction": amt - rec_amt, "priority": "High"}

                entry["reduction"] = max(0.0, entry["current"] - entry["recommended"])
                plan[cname] = entry

            rec["monthly_budget_plan"] = plan
        # FAMILY plan
        else:
            # all member-level logic stays inside this branch
            dfm = self.df[self.df["month_num"] == sel_month].copy()  # member rows in selected month

            member_disc = dfm.groupby("member_id")["non_essential_expenses"].sum()
            if member_disc.empty:
                member_disc = pd.Series(1.0, index=dfm["member_id"].unique(), dtype=float)

            # role-weighted shares
            role_mode = dfm.groupby("member_id")["member_role"] \
                           .agg(lambda s: s.mode().iat[0] if len(s) else "Adult") \
                           .to_dict()

            weights = {}
            for mid, disc in member_disc.items():
                role = role_mode.get(mid, "Adult")
                w = float(self.config["member_role_weights"].get(role, 1.0))
                weights[mid] = float(disc) * w

            total_w = sum(weights.values()) or 1.0
            member_reduction = {mid: reduction_needed * (w / total_w) for mid, w in weights.items()}

            # per-member category sums (use only columns present at member level)
            member_expense_cols = [c for c in expense_cols if c in dfm.columns]
            mem_cat = dfm.groupby("member_id")[member_expense_cols].sum()

            family_plan = {}
            min_floor = float(self.config["member_min_floor_pct"])

            for mid, rowm in mem_cat.iterrows():
                mplan = {}
                member_total_disc = float(dfm.loc[dfm["member_id"] == mid, "non_essential_expenses"].sum()) or 1e-6

                for category, m_amt in rowm.items():
                    amt = float(m_amt)
                    cname = category.replace(self.currency_suffix, "").replace("_", " ").title()
                    lower = category.lower()

                    if any(na in lower for na in self.config["non_adjustable_categories"]):
                        entry = {"current": amt, "recommended": amt, "reduction": 0.0, "priority": "Non-adjustable"}
                    elif any(ess in lower for ess in self.config["essential_categories"]):
                        rec_amt = amt * 0.95
                        entry = {"current": amt, "recommended": rec_amt, "reduction": amt - rec_amt, "priority": "Low"}
                    else:
                        # Pro-rate member reduction to this category
                        cat_share = amt / member_total_disc
                        target_cut = max(0.0, float(member_reduction.get(mid, 0.0)) * cat_share)
                        floor_amt = amt * min_floor
                        rec_amt = max(floor_amt, amt - target_cut)
                        entry = {"current": amt, "recommended": rec_amt, "reduction": amt - rec_amt, "priority": "High"}

                    entry["reduction"] = max(0.0, entry["current"] - entry["recommended"])
                    mplan[cname] = entry

                family_plan[f"member:{mid}"] = mplan

            # household aggregate from member plans
            hh_agg = {}
            canon_names = [c.replace(self.currency_suffix, "").replace("_", " ").title() for c in member_expense_cols]
            for cname in canon_names:
                cur_sum = 0.0; rec_sum = 0.0
                for key, mplan in family_plan.items():
                    if cname in mplan:
                        cur_sum += float(mplan[cname]["current"])
                        rec_sum += float(mplan[cname]["recommended"])
                hh_agg[cname] = {"current": cur_sum, "recommended": rec_sum, "reduction": max(0.0, cur_sum - rec_sum), "priority": "Mixed"}

            rec["monthly_budget_plan"] = {**family_plan, "household:aggregate": hh_agg}

            # Member summaries (still inside family branch)
            summaries = []
            for mid in dfm["member_id"].unique():
                mplan = family_plan.get(f"member:{mid}", {})
                planned_disc = 0.0
                hist_disc = float(dfm.loc[dfm["member_id"] == mid, "non_essential_expenses"].sum())
                for cname, det in mplan.items():
                    low = cname.lower()
                    if (not any(na in low for na in self.config["non_adjustable_categories"])) and \
                       (not any(ess in low for ess in self.config["essential_categories"])):
                        planned_disc += float(det["recommended"])
                summaries.append({
                    "member_id": mid,
                    "role": role_mode.get(mid, "Adult"),
                    "historical_discretionary_monthly": hist_disc,
                    "planned_discretionary_monthly": planned_disc,
                    "allocated_reduction_monthly": float(member_reduction.get(mid, 0.0)),
                })
            rec["member_summaries"] = summaries

        # Steps
        steps = [
            f"Set a monthly expense limit of {target_monthly_expenses:,.0f} {self.currency}",
            "Track expenses against category limits.",
            "Review and optimize top 3 spending categories weekly.",
        ]
        for opp in opportunities:
            steps.append(f"Reduce {opp['category']} by {opp['potential_monthly_savings']:,.0f} {self.currency} this month.")
        rec["actionable_steps"] = steps

        self.recommendations = rec
        self.logger.info(f"Recommendations generated successfully (month {sel_month})")
        return rec

    # --------------------------------------------------------- #
    # FRIENDLY SUMMARY (LLaMA)
    # --------------------------------------------------------- #
    def friendly_summary(self, recommendations: dict, model_name: str = "llama3") -> str:
        """
        Use the local LLaMA via Ollama to produce a friendly explanation.
        """
        try:
            compact = {
                "month": recommendations.get("current_situation", {}).get("month_num"),
                "income": recommendations.get("current_situation", {}).get("avg_monthly_income"),
                "expenses": recommendations.get("current_situation", {}).get("avg_monthly_expenses"),
                "savings_rate": recommendations.get("current_situation", {}).get("current_savings_rate"),
                "target_savings_rate": recommendations.get("current_situation", {}).get("target_savings_rate"),
                "top_steps": recommendations.get("actionable_steps", [])[:3],
            }
            prompt = (
                "Write a short, friendly summary for a Sri Lankan household. Be encouraging."
                " Avoid jargon. 4 bullets max. Include one concrete savings tip."
                f"\n\n{json.dumps(compact, indent=2)}"
            )
            return generate_local_llm_response(prompt, model=model_name)
        except Exception as e:
            return f"(LLM summary unavailable) {e}"

    # --------------------------------------------------------- #
    # PERSISTENCE
    # --------------------------------------------------------- #
    def save_models(self, filepath: str):
        if not self.models:
            raise ValueError("No models available. Run build_predictive_models() first.")
        joblib.dump({"models": self.models, "config": self.config}, filepath)
        self.logger.info(f"Models saved successfully to {filepath}")

    def load_models(self, filepath: str):
        data = joblib.load(filepath)
        self.models = data.get("models", {})
        cfg = data.get("config")
        if cfg:
            self.config = cfg
        self.logger.info(f"Models loaded successfully from {filepath}")

    # --------------------------------------------------------- #
    # REPORT (CLI-friendly)
    # --------------------------------------------------------- #
    def print_recommendations_report(self):
        if not self.recommendations:
            raise ValueError("No recommendations available. Run generate_recommendations() first.")

        current = self.recommendations["current_situation"]
        print("=" * 60)
        print("PERSONALIZED BUDGET RECOMMENDATIONS REPORT")
        print("=" * 60)
        print("\n📊 CURRENT FINANCIAL SITUATION:")
        print(f"Monthly Expenses: {current['avg_monthly_expenses']:,.0f} {self.currency}")
        if current["avg_monthly_income"] > 0:
            print(f"Monthly Income  : {current['avg_monthly_income']:,.0f} {self.currency}")
            print(f"Savings Rate    : {current['current_savings_rate']*100:.1f}%")
            print(f"Target Savings  : {current['target_savings_rate']*100:.1f}%")

        print("\n🎯 OPTIMIZATION OPPORTUNITIES:")
        for opp in self.recommendations["optimization_opportunities"]:
            print(f"• {opp['category']}: {opp['current_spending']:,.0f} ({opp['percentage_of_total']:.1f}%) → cut {opp['potential_monthly_savings']:,.0f}")

        print("\n💰 RECOMMENDED MONTHLY BUDGET:")
        for cat, det in self.recommendations["monthly_budget_plan"].items():
            # household aggregate for family is also shown
            if isinstance(det, dict) and "current" in det:
                print(f"• {cat}: {det['current']:,.0f} → {det['recommended']:,.0f} ({(det['current']-det['recommended']):,.0f} saved)")

        print("\n✅ ACTIONABLE STEPS:")
        for i, step in enumerate(self.recommendations["actionable_steps"], 1):
            print(f"{i}. {step}")

        print("\n" + "=" * 60)


# Example usage (dev/test)
def main():
    # Choose SINGLE or FAMILY file below for a quick test
    csv_path = "single_monthly.csv"  # or "single_monthly.csv"

    cfg = {
        "account_type": "single",       # 'single' or 'family'
        "target_savings_rate": 0.25,
        "default_currency": "LKR",
    }
    model = PersonalizedBudgetRecommender(cfg)

    try:
        print("Loading and preparing data...")
        model.load_and_prepare_data(csv_path)

        print("Building predictive models...")
        model.build_predictive_models()

        print("Predicting next month and next week...")
        print("Next month:", model.predict_budget(horizon="month"))
        print("Next week:", model.predict_budget(horizon="week"))

        print("Generating personalized recommendations (latest month)...")
        rec = model.generate_recommendations(month="latest")
        model.print_recommendations_report()

        ai_msg = model.friendly_summary(rec, model_name="llama3")
        print("\n🤖 AI Insight (LLaMA):")
        print(ai_msg)

    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure your CSV uses monthly totals and ends columns with '_lkr'.")


if __name__ == "__main__":
    main()
