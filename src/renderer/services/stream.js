import ipcRendererSend from './ipc'
import streamHelper from '../../../utils/streamHelper'
import api from '../../../utils/api'

const fetchStream = async (id) => {
  const idToken = await ipcRendererSend('getIdToken', `sendIdToken`)
  try {
    const site = await api.getStream(id, idToken)
    return streamHelper.parseSite(site)
  } catch (e) {
    throw (e)
  }
}

const updateStream = async (streamObj) => {
  const id = streamObj.id
  const obj = streamHelper.parseSite(streamObj)
  return ipcRendererSend('db.streams.update', `db.streams.update.${Date.now()}`, {
    id: id,
    params: obj
  }).then(data => {
    return data.dataValues
  })
}

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
  fetchStream,
  updateStream,
  upsertStreams,
  updateStreams,
  updateStreamStats
}
