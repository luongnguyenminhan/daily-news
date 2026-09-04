import * as Dialog from "@radix-ui/react-dialog";
import { useId, useState } from "react";
import type { Article } from "@/domain/article";
import { Icon } from "@/components/ui/Icon";
import { request } from "@/lib/api";

interface AddSavedLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (article: Article, label?: string) => void;
}

const INITIAL_FORM = {
  url: "",
  name: "",
  topic: "",
};

const inputClassName =
  "h-11 w-full rounded-[7px] border border-[#8490a3] bg-transparent px-3 text-white outline-none transition-colors placeholder:text-[#768297] focus:border-[#6f55dc] focus:ring-2 focus:ring-[#8568ff]/30";

interface ResolvedArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export function AddSavedLinkDialog({
  open,
  onOpenChange,
  onSave,
}: AddSavedLinkDialogProps) {
  const urlId = useId();
  const nameId = useId();
  const topicId = useId();
  const [form, setForm] = useState(INITIAL_FORM);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setResolving(true);
    setError("");

    try {
      const article = await request<ResolvedArticle>(
        `/articles/resolve?url=${encodeURIComponent(form.url.trim())}`,
        { method: "POST" },
      );

      onSave(
        {
          id: `manual-${crypto.randomUUID()}`,
          title: article.title,
          url: article.url,
          source: article.source,
          topic: form.topic.trim(),
          publishedAt: article.publishedAt,
        },
        form.name.trim(),
      );
      setForm(INITIAL_FORM);
      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not resolve link.",
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/55" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-[calc(100vw-32px)] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[11px] border border-[#5a6678] bg-[#111925] p-5 shadow-[0_17px_36px_rgba(0,0,0,.35)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <Dialog.Title className="text-[20px] font-semibold text-white">
                Add saved link
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[#aab6c8]">
                Add a named link to your saved results.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close add saved link dialog"
                className="rounded border-0 bg-transparent text-[#aab6c8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff]"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <label
              className="grid gap-1.5 text-[15px] font-medium text-[#eef0f4]"
              htmlFor={urlId}
            >
              URL
              <input
                id={urlId}
                required
                type="url"
                value={form.url}
                onChange={(event) => updateField("url", event.target.value)}
                className={inputClassName}
                placeholder="https://example.com"
              />
            </label>
            <label
              className="grid gap-1.5 text-[15px] font-medium text-[#eef0f4]"
              htmlFor={nameId}
            >
              Name
              <input
                id={nameId}
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClassName}
                placeholder="Useful resource"
              />
            </label>
            <label
              className="grid gap-1.5 text-[15px] font-medium text-[#eef0f4]"
              htmlFor={topicId}
            >
              Topic
              <input
                id={topicId}
                required
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
                className={inputClassName}
                placeholder="AI, design, engineering..."
              />
            </label>
            {error && (
              <p className="text-sm text-[#ff9ba5]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={resolving}
              className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-[#5638e8] px-5 text-[16px] font-semibold text-white transition-colors hover:bg-[#6749f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff]"
            >
              {resolving ? "Resolving link..." : "Add to saved"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
