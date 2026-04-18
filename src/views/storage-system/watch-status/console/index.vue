<template>
  <div class="console">
    <!--    <CardList></CardList>-->

    <!--    <ElRow :gutter="20">-->
    <!--      <ElCol :sm="24" :md="12" :lg="10">-->
    <!--        <ActiveUser />-->
    <!--      </ElCol>-->
    <!--      <ElCol :sm="24" :md="12" :lg="14">-->
    <!--        <SalesOverview />-->
    <!--      </ElCol>-->
    <!--    </ElRow>-->

    <!--    <ElRow :gutter="20">-->
    <!--      <ElCol :sm="24" :md="24" :lg="12">-->
    <!--        <NewUser />-->
    <!--      </ElCol>-->
    <!--      <ElCol :sm="24" :md="12" :lg="6">-->
    <!--        <Dynamic />-->
    <!--      </ElCol>-->
    <!--      <ElCol :sm="24" :md="12" :lg="6">-->
    <!--        <TodoList />-->
    <!--      </ElCol>-->
    <!--    </ElRow>-->
    <chat-room v-model:user-id="userId" v-model:room-id="roomId" v-model:user-name="username" />
    <!--    <AboutProject />-->
  </div>
</template>

<script setup lang="ts">
  // import CardList from './modules/card-list.vue'
  // import ActiveUser from './modules/active-user.vue'
  // import SalesOverview from './modules/sales-overview.vue'
  // import NewUser from './modules/new-user.vue'
  // import Dynamic from './modules/dynamic-stats.vue'
  // import TodoList from './modules/todo-list.vue'
  // import AboutProject from './modules/about-project.vue'
  import { useCommon } from '@/composables/useCommon'
  import ChatRoom from '@views/storage-system/watch-status/console/modules/chat-room.vue'

  defineOptions({ name: 'BasicConsole' })
  const userId = ref('1234')
  const roomId = ref('56990')
  const username = ref('wqr')
  useCommon().scrollToTop()
</script>

<style lang="scss" scoped>
  @use './style';
</style>
