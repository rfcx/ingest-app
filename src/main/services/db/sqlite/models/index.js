export default function init (sequelize) {
  const models = {
    Stream: require('./stream').default(sequelize)
  }
  // Create associations
  Object.keys(models).forEach((model) => {
    if ('associate' in models[model]) {
      models[model].associate(models)
    }
  })
  return models
}
