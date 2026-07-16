# V12Code Roadmap

**Product name:** V12Code

V12Code is our version of V12Code. The first releases focus on making long-running agent work visible,
keeping the chat uncluttered, and making conversations easy to branch and revise.

## Product rules

- Never hide running work.
- Do not show fake progress percentages. Show the real state, elapsed time, and latest activity.
- Keep the main chat focused on the conversation.
- Make destructive history changes explicit and recoverable.
- Keep event rendering fast and bounded during long sessions.
- Preserve state across navigation, reconnects, and session restarts.

## Release 1: Visible agent activity

Chats with attached agents must show when work is still running, even when the chat is not open.

### Scope

- Show a compact activity indicator on each running chat in the sidebar.
- Show the current state in the open chat: queued, running, waiting for input, failed, or complete.
- Include elapsed time and the latest useful activity when available.
- Keep the state correct when switching chats, reconnecting, or reopening V12Code.
- Clear stale running states after the server confirms that no work remains.
- Use an indeterminate animation when the provider does not report measurable progress.

### Done when

- A user can always tell which chats still have active agents.
- Background work remains visible without opening each chat.
- Reconnects do not create stuck or duplicate activity indicators.

## Release 2: Compact task HUD

Replace the large right-side plan/task panel with a floating component in the top-right of the chat,
similar to Codex.

### Scope

- Show a small floating task button with completed and total task counts.
- Expand it into a popover with the current plan and task list.
- Support task completion, removal, and reordering without opening a permanent sidebar.
- Keep the HUD usable on narrow screens without covering messages or the composer.
- Preserve keyboard navigation and screen-reader labels.

### Done when

- The task list no longer consumes a fixed column.
- Opening and closing the HUD does not resize the chat.
- Task updates stream into the HUD without stealing focus.

## Release 3: Chat forking

Allow a conversation to branch from any user request or assistant response.

### Scope

- Add **Fork chat from here** to message actions.
- Copy history only through the selected message.
- Create a new chat with a clear link back to its parent.
- Leave the original chat unchanged.
- Carry forward the correct workspace, provider, model, and relevant session settings.
- Define reliable behavior when the source chat is still running.

### Done when

- A fork can continue independently without changing the source chat.
- Reloading either branch preserves its parent/child relationship.
- Fork creation is atomic: users never receive a half-created branch.

## Release 4: Edit and rerun

Allow a user request to be edited and run again from that point in history.

### Scope

- Add **Edit and rerun** to user-message actions.
- Restore the edited request to the composer with its attachments and context.
- Remove later history from the active branch only after confirmation.
- Create a recovery branch before replacing history so the old path is not lost.
- Stop or safely detach active work that belongs to the replaced history.
- Run the edited request with the exact conversation state that existed before the original request.

### Done when

- The new run cannot see messages or tool results from the reverted future.
- The old history remains recoverable through its branch.
- Failed reruns do not corrupt either history.

**Dependency:** build this on the same branch/history model used by chat forking.

## Release 5: Rich activity cards

Make tool calls, file changes, and command runs easier to understand at a glance.

### Scope

- Use distinct cards for commands, file reads, file edits, searches, web activity, and other tools.
- Show running, succeeded, failed, canceled, and waiting states consistently.
- For commands, show the command, working directory, duration, exit code, and bounded live output.
- For file changes, show paths, change type, and addition/deletion counts with an expandable diff.
- Group noisy repeated activity while keeping full details available on demand.
- Add copy actions for commands, paths, output, and errors.
- Keep large outputs virtualized or truncated so long sessions stay responsive.

### Done when

- Users can identify what happened without expanding every event.
- Failures show the useful error and the action that caused it.
- Heavy tool streams do not make scrolling or input laggy.

## Release 6: Selection to task

Allow selected conversation text to become a contextual task, like Codex.

### Scope

- Show **Add to tasks** when text is selected in a message.
- Open a small editor for the user's task text before saving.
- Store the quoted selection, source message, chat, author, and timestamp as context.
- Link the task back to the source and scroll to the quoted text when opened.
- Keep task context intact across chat forks and history edits.
- Support keyboard use and touch selection where the platform allows it.

### Done when

- A task contains both the user's instruction and the selected source context.
- The source can be reopened even after navigating away or restarting V12Code.
- Adding a task does not alter or duplicate the selected message.

**Dependency:** uses the compact task HUD from Release 2 and stable message identities from the
branch/history work.

## Later backlog

- Scroll to the bottom after submitting a new message.
- Limit each project list to its ten most recent chats, with a way to reveal older chats.
- Archive chats.
- Put new projects first.
- Sort projects by latest chat activity.
- Queue messages behind an active run.

## Completion gate

Every release must include tests for reconnects, partial streams, and failure recovery. Before a
release is considered complete:

```bash
vp check
vp run typecheck
```

Run `vp run lint:mobile` as well when the release changes native mobile code.
