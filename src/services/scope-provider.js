/* eslint-disable */

class ScopeProvider {
  static async getScopeFilterAsJson(model, user) {
    return JSON.stringify(await ScopeProvider.getScopeFilter(model, user));
  }

  static async getScopeFilter(model, user) {
    // 1. retrieve scope for renderingId
    // 2. do some magic with user.tags from the token to make replacements
    // 3. output filter, which can be used on queries
    if (model.name == 'reviews') {
      return {
        aggregator: 'and',
        conditions: [
          {
            field: 'id',
            operator: 'greater_than',
            value: 10,
          },
          {
            field: 'book:author',
            operator: 'equal',
            value: 'Vules Jernes',
          },
        ],
      };
    }

    if (model.name == 'books') {
      return { 
        field: 'author',
        operator: 'equal',
        value: 'Vules Jernes',
      }
    }
    
    return null;
  }
}

module.exports = ScopeProvider;
