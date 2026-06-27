<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Rainbot</title></svelte:head>

{#if !data.campaigns}
  <p>Something went wrong.</p>
{:else if data.campaigns.length === 0}
  <h1>Welcome to Rainbot</h1>
  <p>Log in with Discord to see your campaigns.</p>
  <p><a href="/auth/login">Log in with Discord</a></p>
{:else}
  <h1>Your campaigns</h1>
  <ul class="campaigns">
    {#each data.campaigns as campaign (campaign.id)}
      <li>
        <a href="/campaigns/{campaign.id}">{campaign.name}</a>
        <span class="role">{campaign.role}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .campaigns {
    list-style: none;
    padding: 0;
  }
  .campaigns li {
    padding: 0.75rem 1rem;
    background: #25252b;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
  }
  .role {
    color: #a8a8b0;
    text-transform: uppercase;
    font-size: 0.75rem;
    align-self: center;
  }
</style>
