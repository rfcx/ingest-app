import ipcRendererSend from './ipc'

const updateStreamStats = async (id, stats) => {
  const stream = await ipcRendererSend('db.streams.get', `db.streams.get.${Date.now()}`, id)
  let params = {}
  stats.forEach((stat) => {
    params[stat.name] = stream[stat.name] + (stat.action === '+' ? stat.diff : -stat.diff)
  })
  await ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, { id, params })
}

const upsertStreams = async (streams) => {
  const insertOrUpdateStreams = ipcRendererSend('db.streams.upsert', `db.streams.upsert.${Date.now()}`, streams)

  // remove stream that got removed from server
  const deleteNonExistingStreams = ipcRendererSend('db.streams.delete', `db.streams.delete.${Date.now()}`, {
    where: {
      id: {
        '$nin': streams.map(s => s.id)
      }
    }
  })
  return Promise.all([insertOrUpdateStreams, deleteNonExistingStreams])
}

const updateStreams = async (streams) => {
  await ipcRendererSend('db.streams.bulkUpdate', `db.streams.bulkUpdate.${Date.now()}`, {
    where: {},
    values: streams
  })
}

export default {
  upsertStreams,
  updateStreams,
  updateStreamStats
}
