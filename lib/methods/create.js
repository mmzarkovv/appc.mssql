var _ = require('lodash'),
	sql = require('mssql');

/**
 * Creates a new Model or Collection object.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Array<Object>/Object} [values] Attributes to set on the new model(s).
 * @param {Function} callback Callback passed an Error object (or null if successful), and the new model or collection.
 * @throws {Error}
 */
exports.create = function (Model, values, callback) {
	var self = this,
		payload = Model.instance(values, false).toPayload(),
		table = this.getTableName(Model),
		primaryKeyColumn = this.getPrimaryKeyColumn(Model),
		columns = _.without(_.keys(payload), 'id', 'timestamp'),
		placeholders = columns.map(function (key) { return '@' + key; }),
		query = 'INSERT INTO ' + table + ' (' + columns.join(',') + ') OUTPUT INSERTED.* VALUES (' + placeholders.join(',') + ')';

	this.logger.debug('create query:', query);
	this.logger.debug('create query values:', payload);
	var request = new sql.Request(this.connection);
	this.addValuesToSQLRequest(Model, payload, request, true);
	request.query(query, function createQueryCallback(err, results) {
		if (err) {
			self.logger.trace('create error:', err);
			return callback(err);
		}
		var row = results && results[0];
		if (row) {
			var instance = Model.instance(self.transformRow(Model, row), true);
			if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
			self.logger.trace('create results:', instance);
			callback(null, instance);
		}
		else {
			callback();
		}
	});
};
