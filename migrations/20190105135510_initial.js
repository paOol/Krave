exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('Jobs', function(table) {
      table.increments('id').primary();
      table.string('username');
      table.string('address');
      table.integer('blockheight');
      table.string('txid');
      table.boolean('completed');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('modified_at').defaultTo(knex.fn.now());
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('Jobs')
  ]);
};
