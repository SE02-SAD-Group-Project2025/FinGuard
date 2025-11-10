import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* Run once in DB:
create table if not exists categories(
  id serial primary key,
  name text not null
);

create table if not exists transactions(
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  category_id int references categories(id),
  amount_lkr numeric(14,2) not null,
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz default now()
);
*/

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `select t.id, t.amount_lkr, t.description, t.occurred_at, c.name as category
     from transactions t
     left join categories c on c.id = t.category_id
     where t.user_id=$1
     order by occurred_at desc, id desc
     limit 200`,
    [req.user.id]
  );
  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { amount_lkr, description, occurred_at, category_id } = req.body;
    if (!amount_lkr) return res.status(400).json({ error: "amount_lkr required" });

    const { rows } = await pool.query(
      `insert into transactions(user_id, amount_lkr, description, occurred_at, category_id)
       values ($1,$2,$3,$4,$5)
       returning id, amount_lkr, description, occurred_at, category_id`,
      [req.user.id, amount_lkr, description ?? null, occurred_at ?? new Date(), category_id ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Create failed" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await pool.query("delete from transactions where id=$1 and user_id=$2", [id, req.user.id]);
  res.json({ ok: true });
});

export default router;
