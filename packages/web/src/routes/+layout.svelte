<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<header>
  <a href="/" class="brand">Rainbot</a>
  <nav>
    {#if data.user}
      <span>{data.user.username}</span>
      <a href="/auth/logout">Log out</a>
    {:else}
      <a href="/auth/login">Log in with Discord</a>
    {/if}
  </nav>
</header>

<main>
  {@render children()}
</main>

<style>
  :global(body) {
    font-family: system-ui, sans-serif;
    margin: 0;
    background: #1a1a1e;
    color: #e8e8ea;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: #25252b;
    border-bottom: 1px solid #34343c;
  }
  .brand {
    font-weight: 700;
    font-size: 1.2rem;
    color: #e8e8ea;
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  nav span {
    color: #a8a8b0;
  }
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  :global(a) {
    color: #8ab4f8;
  }
</style>
