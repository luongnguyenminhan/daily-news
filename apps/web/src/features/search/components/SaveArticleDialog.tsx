import * as Dialog from "@radix-ui/react-dialog";
import { useId } from "react";
import { Icon } from "@/components/ui/Icon";

interface SaveArticleDialogProps {
  open: boolean;
  label: string;
  topic: string;
  onLabelChange: (label: string) => void;
  onTopicChange: (topic: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SaveArticleDialog({
  open,
  label,
  topic,
  onLabelChange,
  onTopicChange,
  onOpenChange,
  onSave,
}: SaveArticleDialogProps) {
  const nameId = useId();
  const topicId = useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="absolute right-0 top-[65px] z-10 w-[calc(100vw-32px)] rounded-[9px] border border-[#5a6678] bg-[#111925] p-5 shadow-[0_17px_36px_rgba(0,0,0,.35)] sm:w-[363px]">
        <div className="mb-[13px] flex items-center justify-between">
          <Dialog.Title className="text-[18px]">Save link</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close save dialog"
              className="rounded border-0 bg-transparent text-[#aab6c8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff]"
            >
              <Icon name="close" className="h-[19px] w-[19px]" />
            </button>
          </Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">
          Save this article with an optional label and topic.
        </Dialog.Description>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="my-3 grid grid-cols-[73px_1fr] items-center gap-2.5 text-[16px] text-[#eef0f4]">
            <label htmlFor={nameId}>Name</label>
            <input
              id={nameId}
              className="h-[41px] min-w-0 rounded border border-[#8490a3] bg-transparent px-2.5 text-white outline-none transition-colors focus:border-[#6f55dc] focus:ring-2 focus:ring-[#8568ff]/30"
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Optional label"
            />
          </div>
          <div className="my-3 grid grid-cols-[73px_1fr] items-center gap-2.5 text-[16px] text-[#eef0f4]">
            <label htmlFor={topicId}>Topic</label>
            <input
              id={topicId}
              className="h-[41px] min-w-0 rounded border border-[#8490a3] bg-transparent px-2.5 text-white outline-none transition-colors focus:border-[#6f55dc] focus:ring-2 focus:ring-[#8568ff]/30"
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="ml-auto mt-[14px] block rounded border-0 bg-transparent px-1 text-[20px] text-[#9565ff] transition-colors hover:text-[#b49aff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff]"
          >
            Save
          </button>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
