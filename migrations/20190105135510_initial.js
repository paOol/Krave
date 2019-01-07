exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('Jobs', function(table) {
      table.increments('id').primary();
      table.string('username');
      table.string('address');
      table.string('number');
      table.string('uniqid');
      table.integer('blockheight');
      table.string('paidwithtxid');
      table.string('registrationtxid');
      table.boolean('completed').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('modified_at').defaultTo(knex.fn.now());
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('Jobs')]);
};
