import ipcRendererSend from './ipc'

const updateStreamStats = async (id, stats) => {
  const stream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, id)
  let params = {}
  stats.forEach((stat) => {
    params[stat.name] = stream[stat.name] + (stat.action === '+' ? stat.diff : -stat.diff)
  })
  await ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, { id, params })
}

export default {
  updateStreamStats
}
