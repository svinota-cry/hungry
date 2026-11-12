import { useCallback } from "react";
import { useStore } from "./store";
import { useUI } from "./ui";
import type { Entry } from "./types";

export function useEntryDelete() {
  const { removeEntry, restoreEntry } = useStore();
  const { notify } = useUI();
  return useCallback(
    (entry: Entry) => {
      const removed = removeEntry(entry.id);
      if (removed) {
        notify("Удалено. Как будто ничего не было.", {
          label: "вернуть",
          onClick: () => restoreEntry(removed),
        });
      }
    },
    [removeEntry, restoreEntry, notify],
  );
}
