export default {
  up: (queryInterface, Sequelize) => {
    // remove site that has no files
    return queryInterface.sequelize.query(`DELETE FROM streams WHERE id NOT IN (SELECT DISTINCT stream_id FROM files)`)
  }
}
