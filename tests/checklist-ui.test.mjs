import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const checklistSource = fs.readFileSync(new URL("../app/private/checklist/page.tsx", import.meta.url), "utf8");
const editorSource = fs.readFileSync(new URL("../app/private/editor/page.tsx", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("daily checklist page only allows ticking tasks", () => {
  assert.doesNotMatch(checklistSource, /task-remove/);
  assert.doesNotMatch(checklistSource, /removeTask/);
  assert.doesNotMatch(checklistSource, /add-task-form/);
  assert.doesNotMatch(checklistSource, /addTask/);
  assert.match(checklistSource, /className="task-checkbox"/);
  assert.match(checklistSource, /href="\/private\/editor" className="checklist-editor-link"/);
});

test("daily checklist checkbox is sized for touch", () => {
  assert.match(cssSource, /\.task-checkbox\s*{[\s\S]*width:\s*32px;/);
  assert.match(cssSource, /\.task-checkbox\s*{[\s\S]*height:\s*32px;/);
});

test("checklist page includes the weekly checklist condition", () => {
  assert.match(checklistSource, /Weekly Checklist/);
  assert.match(checklistSource, /weeklyTasks/);
  assert.match(checklistSource, /DEFAULT_WEEKLY_TASKS/);
  assert.match(checklistSource, /action: "toggleWeekly"/);
});

test("page editor is the place to add checklist tasks", () => {
  assert.match(editorSource, /const \[checklistTasks, setChecklistTasks\]/);
  assert.match(editorSource, /addChecklistTask/);
  assert.match(editorSource, /Remove Task/);
  assert.match(editorSource, /fetch\("\/api\/private\/checklist"/);
});

test("page editor can manage weekly checklist tasks", () => {
  assert.match(editorSource, /const \[weeklyChecklistTasks, setWeeklyChecklistTasks\]/);
  assert.match(editorSource, /const \[newWeeklyChecklistTask, setNewWeeklyChecklistTask\]/);
  assert.match(editorSource, /Weekly Checklist Tasks/);
  assert.match(editorSource, /Manage weekly checklist tasks here/);
  assert.match(editorSource, /addWeeklyChecklistTask/);
  assert.match(editorSource, /removeWeeklyChecklistTask/);
  assert.match(editorSource, /action: "addWeekly"/);
  assert.match(editorSource, /action: "removeWeekly"/);
});
