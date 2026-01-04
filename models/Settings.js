const db = require('../database/connection');

// Currency configuration for each branch location
const BRANCH_CURRENCIES = {
  'Malappuram': { currency: 'INR', symbol: '₹' },
  'Kochi': { currency: 'INR', symbol: '₹' },
  'Bangalore': { currency: 'INR', symbol: '₹' },
  'Dubai': { currency: 'AED', symbol: 'د.إ' },
  'London': { currency: 'GBP', symbol: '£' }
};

class Settings {
  // Get all settings
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM settings ORDER BY setting_key');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  }

  // Get single setting
  static async get(key, defaultValue = null) {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    return rows[0]?.setting_value || defaultValue;
  }

  // Set setting
  static async set(key, value) {
    const [result] = await db.query(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
    `, [key, value, value]);
    return result.affectedRows;
  }

  // Delete setting
  static async delete(key) {
    const [result] = await db.query('DELETE FROM settings WHERE setting_key = ?', [key]);
    return result.affectedRows;
  }

  // Get currency for a specific branch/city
  static getCurrencyForCity(city) {
    return BRANCH_CURRENCIES[city] || { currency: 'INR', symbol: '₹' };
  }

  // Get all supported currencies
  static getSupportedCurrencies() {
    return [
      { code: 'INR', symbol: '₹', name: 'Indian Rupee', locations: ['Malappuram', 'Kochi', 'Bangalore'] },
      { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locations: ['Dubai'] },
      { code: 'GBP', symbol: '£', name: 'British Pound', locations: ['London'] }
    ];
  }

  // Get company info
  static async getCompanyInfo() {
    return {
      name: await this.get('company_name', '26:07'),
      tagline: await this.get('company_tagline', 'Company Management System'),
      email: await this.get('company_email', ''),
      phone: await this.get('company_phone', ''),
      address: await this.get('company_address', ''),
      currency: await this.get('currency', 'INR'),
      currencySymbol: await this.get('currency_symbol', '₹'),
      supportedCurrencies: await this.get('supported_currencies', 'INR,AED,GBP'),
      dateFormat: await this.get('date_format', 'YYYY-MM-DD'),
      logo: await this.get('company_logo', ''),
      branchCurrencies: BRANCH_CURRENCIES
    };
  }

  // Update company info
  static async updateCompanyInfo(info) {
    const keys = ['company_name', 'company_tagline', 'company_email', 'company_phone', 
                  'company_address', 'currency', 'currency_symbol', 'date_format', 'company_logo'];
    
    for (const key of keys) {
      const value = info[key.replace('company_', '')];
      if (value !== undefined) {
        await this.set(key, value);
      }
    }
    return true;
  }
}

module.exports = Settings;
