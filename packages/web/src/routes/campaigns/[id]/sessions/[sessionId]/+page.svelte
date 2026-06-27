<script lang="ts">
  import type { PageData } from "./$types";
  import TaperedRule from "$lib/components/TaperedRule.svelte";

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string): string {
    return new Date(d).toLocaleString("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }
</script>

<svelte:head><title>Session — {formatDate(data.session.startedAt)}</title></svelte:head>

<p><a href="/campaigns/{data.session.campaignId}">← Campaign</a></p>

<div class="panel">
  <p class="eyebrow">Session Chronicle</p>
  <h1>{formatDate(data.session.startedAt)}</h1>
  <TaperedRule />
  <p class="muted status">Status: {data.session.status}</p>

  <h2>Recap</h2>
  {#if data.session.recap}
    <p class="prose">{data.session.recap}</p>
  {:else}
    <p class="empty">The bards have not yet composed this tale.</p>
  {/if}

  <h2>Summary</h2>
  {#if data.session.summary}
    <p class="prose">{data.session.summary}</p>
  {:else}
    <p class="empty">Not yet available.</p>
  {/if}

  <h2>Transcript</h2>
  {#if data.session.transcript}
    <pre class="transcript">{data.session.transcript}</pre>
  {:else}
    <p class="empty">Not yet available.</p>
  {/if}
</div>

<style>
  .status {
    margin-top: -0.5rem;
  }
  .prose {
    line-height: 1.7;
    white-space: pre-wrap;
  }
  .transcript {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    background: var(--surface-sunken);
    border: 1px solid var(--edge);
    border-left: 3px solid var(--gold);
    border-radius: 4px;
    padding: 1rem 1.2rem;
    overflow-x: auto;
  }
</style>
