# User constraints for this reconstruction

- Keep total concurrent model work at **five lanes or fewer, including the primary agent**. At most four sub-agents may run. Prefer fewer when additional agents do not improve a concrete result.
- The user explicitly requires sub-agents to use **`gpt-6.1-sol` with `reasoning_effort: "max"`**. Do not substitute `high` or merely write “Max” in a prompt. This file does not independently request new delegation.
- The ten earlier `reference_01` through `reference_10` agents used `high` and have been interrupted. Do not resume those configurations. Four replacement Max agents currently handle references04,05,06,10; rotate bounded assignments when needed.
- Give each active worker one scene and one or two well-supported corrections. Check the original and actual render before editing, verify the result, commit, then let the primary agent review. Avoid indefinite autonomous trial loops and repetitive status messages.
- All ten supplied references remain in scope. Model concurrency limits do not reduce the deliverable to a subset of the scenes.
- Use only code-generated visual geometry/materials. Reference photographs are comparison inputs, never scene planes/textures. The permitted external media exception is credited free background music.
- Actual still and motion jobs must use `tools/render-one-reconstruction.mjs` and its shared mutex. The complete live review test `tools/check-ten-review.mjs` uses the same mutex. Do not launch parallel ad-hoc Chromium jobs around the queue.
- Preserve failed candidates and receipts with honest status. Successful loading, finite geometry, linked shaders and nonempty pixels do not establish photographic fidelity or completion.
- Continue using the public repository and explicit source/render identities. Keep the ongoing reconstruction separate from rejected historical films; never describe a draft as a finished match.
