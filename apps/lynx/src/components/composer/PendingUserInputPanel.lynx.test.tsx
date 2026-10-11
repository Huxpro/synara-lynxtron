import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, fireEvent, render } from "@lynx-js/react/testing-library";
import { PendingUserInputPanel } from "./PendingUserInputPanel.lynx";

describe("controlled pending questions", () => {
  beforeEach(() => {
    rs.useFakeTimers();
  });
  afterEach(() => {
    rs.useRealTimers();
  });
  const questions = [
    {
      id: "mode",
      header: "Mode",
      question: "Which mode?",
      options: [{ label: "Read only", description: "Inspect" }],
    },
    { id: "notes", header: "Notes", question: "Anything else?", options: [] },
  ];
  function mount(multiSelect = false) {
    const answer = { selectedOptionLabels: ["Read only"] };
    const props = {
      questions: [{ ...questions[0]!, multiSelect }, questions[1]!],
      questionIndex: 0,
      answers: {},
      submissionVersion: 0,
      isResponding: false,
      onToggleOption: rs.fn(() => answer),
      onAdvance: rs.fn(),
      onPrevious: rs.fn(),
      onCancel: rs.fn(),
    };
    const view = render(<PendingUserInputPanel {...props} />);
    const choose = () => {
      const row = elementTree.root?.querySelector(".ComposerChoiceRowLynx");
      if (!row) throw new Error("choice missing");
      fireEvent.tap(row);
    };
    return { props, view, choose, answer };
  }
  it("auto advances once after 200ms with the selected answer and no separate editor", async () => {
    const { props, view, choose, answer } = mount();
    expect(elementTree.root?.querySelector("input")).toBeNull();
    choose();
    choose();
    await act(async () => {
      await rs.advanceTimersByTimeAsync(199);
    });
    expect(props.onAdvance).not.toHaveBeenCalled();
    await act(async () => {
      await rs.advanceTimersByTimeAsync(1);
    });
    expect(props.onAdvance).toHaveBeenCalledTimes(1);
    expect(props.onAdvance).toHaveBeenCalledWith({ mode: answer });
    view.unmount();
  });
  it("cancels scheduled navigation when a question changes or the panel unmounts", async () => {
    const { props, view, choose } = mount();
    choose();
    view.rerender(<PendingUserInputPanel {...props} questionIndex={1} />);
    await act(async () => {
      await rs.advanceTimersByTimeAsync(200);
    });
    expect(props.onAdvance).not.toHaveBeenCalled();
    view.rerender(<PendingUserInputPanel {...props} />);
    choose();
    view.unmount();
    await act(async () => {
      await rs.advanceTimersByTimeAsync(200);
    });
    expect(props.onAdvance).not.toHaveBeenCalled();
  });
  it("lets multiselect collect answers without automatic navigation", async () => {
    const { props, view, choose } = mount(true);
    choose();
    await act(async () => {
      await rs.advanceTimersByTimeAsync(500);
    });
    expect(props.onToggleOption).toHaveBeenCalledWith("mode", "Read only");
    expect(props.onAdvance).not.toHaveBeenCalled();
    view.unmount();
  });
});
