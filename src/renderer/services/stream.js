import ipcRendererSend from './ipc'

const updateStreamStats = async (id, stats) => {
  const stream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, id)
  let params = {}
  stats.forEach((stat) => {
    params[stat.name] = stream[stat.name] + (stat.action === '+' ? stat.diff : -stat.diff)
  })
  await ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, { id, params })
}

const insertStreams = async (streams) => {
  await ipcRendererSend('db.streams.bulkCreate', `db.streams.bulkCreate.${Date.now()}`, streams)
}

const updateStreams = async (streams) => {
  await ipcRendererSend('db.streams.bulkUpdate', `db.streams.bulkUpdate.${Date.now()}`, {
    where: {},
    values: streams
  })
}

export default {
  insertStreams,
  updateStreams,
  updateStreamStats
}
