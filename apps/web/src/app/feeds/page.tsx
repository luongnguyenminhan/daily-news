"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Nav } from "@/components/Nav";
import { api, type Feed } from "@/lib/api";

export default function Feeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [form, setForm] = useState({ url: "", name: "", topic: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ url: "", name: "", topic: "" });
  const [error, setError] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  async function refresh() {
    setFeeds(await api.listFeeds());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed to load feeds"));
  }, []);

  useGSAP(
    () => {
      if (!listRef.current) return;
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05 },
      );
    },
    { dependencies: [feeds], scope: listRef },
  );

  function startEdit(feed: Feed) {
    setEditingId(feed.id);
    setEditForm({ url: feed.url, name: feed.name, topic: feed.topic });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.createFeed(form);
      setForm({ url: "", name: "", topic: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    }
  }

  async function handleSaveEdit(id: string) {
    try {
      await api.updateFeed(id, editForm);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feed");
    }
  }

  async function handleDelete(id: string) {
    await api.deleteFeed(id);
    await refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pb-32">
      <Nav />

      <section className="pt-32 pb-12 md:pt-40">
        <span className="mb-4 block font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-ink-faint uppercase">
          Source management
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink">
          Feeds
        </h1>
      </section>

      <form
        onSubmit={handleAdd}
        className="mb-10 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-surface-raised/60 p-6 md:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://example.com/rss"
          className={inputClass}
        />
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          className={inputClass}
        />
        <input
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          placeholder="Topic"
          className={inputClass}
        />
        <button
          type="submit"
          className="rounded-xl bg-ink px-6 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-105"
        >
          Add
        </button>
      </form>

      {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

      <ul ref={listRef} className="flex flex-col gap-3">
        {feeds.map((feed) =>
          editingId === feed.id ? (
            <li
              key={feed.id}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-accent/40 bg-surface-raised/60 p-5 md:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <input value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className={inputClass} />
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
              <input value={editForm.topic} onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })} className={inputClass} />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(feed.id)}
                  className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-ink-dim"
                >
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li
              key={feed.id}
              className="group flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-surface-raised/60 p-5 transition-colors duration-300 hover:border-white/20 md:flex-row md:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-display)] font-medium text-ink">{feed.name}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-ink-dim uppercase">
                    {feed.topic}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-faint">{feed.url}</p>
              </div>
              <div className="flex shrink-0 gap-2 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                <button onClick={() => startEdit(feed)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-ink-dim hover:text-ink">
                  Edit
                </button>
                <button onClick={() => handleDelete(feed.id)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-red-400 hover:bg-red-400/10">
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
        {feeds.length === 0 && <p className="text-sm text-ink-faint">No feeds yet — add one above.</p>}
      </ul>
    </main>
  );
}
