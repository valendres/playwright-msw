<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getUsers, User } from '../api/users';

const count = ref(0);

const isLoading = ref(true);
const users = ref<User[]>([]);

onMounted(async () => {
  users.value = await getUsers();
  isLoading.value = false;
});
</script>

<template>
  <h1>Users</h1>

  <div v-if="isLoading">
    <p>Loading...</p>
  </div>

  <div v-else>
    <ul>
      <li v-for="user in users">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
