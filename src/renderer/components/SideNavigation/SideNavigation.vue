<template>
    <aside class="column is-one-quarter menu">
        <div class="menu-container">
            <p class="menu-label"> {{ menuTitle }} </p>
            <a href="#"><img src="~@/assets/ic-add.svg"></a>
        </div>
        <ul class="menu-list">
            <li v-for="item in items" :key="item.id">
                <div class="menu-item" :class="item.isActive">
                    <div class="menu-container">
                        <span class="stream-title"> {{ item.id }} </span>
                        <img :src="getStateImgUrl(item.state)">
                    </div>
                    <div class="state-progress" v-if="item.notSynced">
                        <progress class="progress is-primary" :value="item.progress" max="100"></progress>
                        <div class="menu-container">
                            <span>{{ item.state }}</span>
                            <span> {{ item.additional }} </span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </aside>
</template>

<script>
  export default {
    data () {
      return {
        menuTitle: 'Streams',
        siteName: 'Osa Conservation',
        login: true,
        items: [
          { id: 'Jaguar 1', state: 'uploading', progress: 60, additional: '2/4 synced 1 error', notSynced: true, isActive: true },
          { id: 'Pucho Tree', state: 'waiting', progress: 0, additional: '', notSynced: true, isActive: false },
          { id: 'Jaguar 2', state: 'completed', progress: 100, additional: '', notSynced: false, isActive: false }
        ],
        isActive: {
          'is-active': true
        }
      }
    },
    methods: {
      getStateImgUrl (state) {
        return require(`../../assets/ic-state-${state}.svg`)
      }
    }
  }
</script>
