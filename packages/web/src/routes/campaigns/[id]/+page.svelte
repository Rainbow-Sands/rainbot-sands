<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const dm = $derived(data.campaign.members.find((m) => m.role === "dm"));
  const players = $derived(
    data.campaign.members.filter((m) => m.role !== "dm")
  );

  function formatDate(d: Date | string): string {
    return new Date(d).toLocaleString("en-CA");
  }
</script>

<svelte:head><title>{data.campaign.name}</title></svelte:head>

<p><a href="/">← Campaigns</a></p>
<h1>{data.campaign.name}</h1>
{#if data.campaign.description}
  <p>{data.campaign.description}</p>
{/if}

<h2>Dungeon Master</h2>
<p>{dm ? dm.username : "—"}</p>

<h2>Players</h2>
{#if players.length === 0}
  <p>No players yet.</p>
{:else}
  <ul>
    {#each players as player (player.id)}
      <li>{player.username}</li>
    {/each}
  </ul>
{/if}

<h2>Sessions</h2>
{#if data.campaign.sessions.length === 0}
  <p>No sessions recorded yet.</p>
{:else}
  <ul class="sessions">
    {#each data.campaign.sessions as session (session.id)}
      <li>
        <a href="/campaigns/{data.campaign.id}/sessions/{session.id}">
          {formatDate(session.startedAt)}
        </a>
        <span class="status">{session.status}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .sessions {
    list-style: none;
    padding: 0;
  }
  .sessions li {
    padding: 0.6rem 1rem;
    background: #25252b;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
  }
  .status {
    color: #a8a8b0;
    text-transform: uppercase;
    font-size: 0.75rem;
    align-self: center;
  }
</style>
