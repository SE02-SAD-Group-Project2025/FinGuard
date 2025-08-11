// Smart Expense Categorization Service
class SmartCategorizationService {
  constructor() {
    // Pre-defined patterns for common expenses
    this.categoryPatterns = {
      'Food & Dining': [
        'restaurant', 'food', 'pizza', 'coffee', 'lunch', 'dinner', 'breakfast',
        'mcdonald', 'kfc', 'subway', 'burger', 'cafe', 'bakery', 'grocery',
        'supermarket', 'market', 'fruits', 'vegetables', 'milk', 'bread',
        'rice', 'chicken', 'fish', 'meat', 'snacks', 'drinks', 'tea'
      ],
      'Transportation': [
        'uber', 'taxi', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'gas',
        'parking', 'toll', 'metro', 'railway', 'airport', 'flight',
        'car', 'bike', 'vehicle', 'transport', 'fare', 'ticket'
      ],
      'Shopping': [
        'amazon', 'flipkart', 'mall', 'shop', 'store', 'clothes', 'dress',
        'shirt', 'shoes', 'bag', 'electronics', 'mobile', 'laptop',
        'headphones', 'watch', 'gift', 'jewellery', 'cosmetics', 'perfume'
      ],
      'Entertainment': [
        'movie', 'cinema', 'theater', 'netflix', 'spotify', 'youtube',
        'game', 'gaming', 'party', 'club', 'bar', 'concert', 'show',
        'entertainment', 'fun', 'recreation', 'sports', 'gym', 'fitness'
      ],
      'Bills & Utilities': [
        'electricity', 'water', 'gas', 'phone', 'internet', 'wifi',
        'mobile', 'bill', 'utility', 'insurance', 'emi', 'loan',
        'rent', 'maintenance', 'society', 'cable', 'broadband'
      ],
      'Healthcare': [
        'doctor', 'hospital', 'medical', 'pharmacy', 'medicine', 'health',
        'dental', 'clinic', 'checkup', 'treatment', 'surgery', 'therapy',
        'vaccination', 'ambulance', 'emergency', 'vitamins', 'supplements'
      ],
      'Education': [
        'school', 'college', 'university', 'course', 'book', 'study',
        'tuition', 'coaching', 'training', 'certification', 'exam',
        'education', 'learning', 'workshop', 'seminar', 'conference'
      ],
      'Travel': [
        'hotel', 'booking', 'airbnb', 'travel', 'trip', 'vacation',
        'holiday', 'tour', 'sightseeing', 'luggage', 'visa', 'passport'
      ]
    };

    // Load user's historical data for learning
    this.userPatterns = this.loadUserPatterns();
  }

  // Load user's historical categorization patterns from localStorage
  loadUserPatterns() {
    try {
      const stored = localStorage.getItem('finguard-user-category-patterns');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading user patterns:', error);
      return {};
    }
  }

  // Save user's categorization choice for learning
  saveUserPattern(description, category) {
    const words = this.extractKeywords(description);
    
    words.forEach(word => {
      if (!this.userPatterns[category]) {
        this.userPatterns[category] = {};
      }
      
      // Increase weight for this word-category combination
      this.userPatterns[category][word] = (this.userPatterns[category][word] || 0) + 1;
    });

    // Save to localStorage
    try {
      localStorage.setItem('finguard-user-category-patterns', JSON.stringify(this.userPatterns));
    } catch (error) {
      console.error('Error saving user patterns:', error);
    }
  }

  // Extract meaningful keywords from description
  extractKeywords(description) {
    if (!description) return [];

    // Convert to lowercase and remove special characters
    const cleaned = description.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split into words and filter out common words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
    
    return cleaned.split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Limit to 5 most relevant words
  }

  // Suggest category based on description
  suggestCategory(description) {
    if (!description || description.trim().length < 3) {
      return null;
    }

    const keywords = this.extractKeywords(description);
    const categoryScores = {};

    // Check against pre-defined patterns
    Object.keys(this.categoryPatterns).forEach(category => {
      const patterns = this.categoryPatterns[category];
      let score = 0;

      keywords.forEach(keyword => {
        patterns.forEach(pattern => {
          if (keyword.includes(pattern) || pattern.includes(keyword)) {
            score += 1;
          }
        });
      });

      if (score > 0) {
        categoryScores[category] = (categoryScores[category] || 0) + score;
      }
    });

    // Check against user's learned patterns (give higher weight)
    Object.keys(this.userPatterns).forEach(category => {
      const userWords = this.userPatterns[category];
      let userScore = 0;

      keywords.forEach(keyword => {
        if (userWords[keyword]) {
          userScore += userWords[keyword] * 2; // User patterns get double weight
        }
      });

      if (userScore > 0) {
        categoryScores[category] = (categoryScores[category] || 0) + userScore;
      }
    });

    // Return the category with highest score
    if (Object.keys(categoryScores).length === 0) {
      return null;
    }

    const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );

    // Only suggest if confidence is reasonably high
    const confidence = categoryScores[bestCategory];
    return confidence >= 1 ? {
      category: bestCategory,
      confidence: Math.min(confidence * 10, 100) // Convert to percentage, max 100%
    } : null;
  }

  // Get category suggestions with confidence scores
  getCategorySuggestions(description, limit = 3) {
    if (!description || description.trim().length < 3) {
      return [];
    }

    const keywords = this.extractKeywords(description);
    const categoryScores = {};

    // Calculate scores for all categories
    Object.keys(this.categoryPatterns).forEach(category => {
      const patterns = this.categoryPatterns[category];
      let score = 0;

      keywords.forEach(keyword => {
        patterns.forEach(pattern => {
          if (keyword.includes(pattern) || pattern.includes(keyword)) {
            score += 1;
          }
        });
      });

      if (score > 0) {
        categoryScores[category] = score;
      }
    });

    // Add user pattern scores
    Object.keys(this.userPatterns).forEach(category => {
      const userWords = this.userPatterns[category];
      let userScore = 0;

      keywords.forEach(keyword => {
        if (userWords[keyword]) {
          userScore += userWords[keyword] * 2;
        }
      });

      if (userScore > 0) {
        categoryScores[category] = (categoryScores[category] || 0) + userScore;
      }
    });

    // Sort by score and return top suggestions
    return Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([category, score]) => ({
        category,
        confidence: Math.min(score * 10, 100)
      }));
  }

  // Clear user patterns (for reset/privacy)
  clearUserPatterns() {
    this.userPatterns = {};
    localStorage.removeItem('finguard-user-category-patterns');
  }

  // Export user patterns (for backup/sync)
  exportUserPatterns() {
    return JSON.stringify(this.userPatterns);
  }

  // Import user patterns (for restore/sync)
  importUserPatterns(patternsJson) {
    try {
      this.userPatterns = JSON.parse(patternsJson);
      localStorage.setItem('finguard-user-category-patterns', patternsJson);
      return true;
    } catch (error) {
      console.error('Error importing user patterns:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const smartCategorization = new SmartCategorizationService();
export default smartCategorization;