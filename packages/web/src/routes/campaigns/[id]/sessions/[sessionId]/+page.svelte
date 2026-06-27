<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string): string {
    return new Date(d).toLocaleString("en-CA");
  }
</script>

<svelte:head><title>Session — {formatDate(data.session.startedAt)}</title></svelte:head>

<p><a href="/campaigns/{data.session.campaignId}">← Campaign</a></p>
<h1>Session</h1>
<p class="meta">
  {formatDate(data.session.startedAt)} · {data.session.status}
</p>

<h2>Recap</h2>
{#if data.session.recap}
  <p class="prose">{data.session.recap}</p>
{:else}
  <p class="empty">Not yet available.</p>
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

<style>
  .meta {
    color: #a8a8b0;
  }
  .prose {
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .empty {
    color: #6c6c76;
    font-style: italic;
  }
  .transcript {
    white-space: pre-wrap;
    background: #25252b;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    line-height: 1.5;
  }
</style>
