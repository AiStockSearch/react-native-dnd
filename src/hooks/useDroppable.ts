import { useLayoutEffect } from "react";
import { type LayoutRectangle, type ViewProps } from "react-native";
import { runOnUI, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useLatestSharedValue, useNodeRef } from "src/hooks";
import type { Data, NativeElement, UniqueIdentifier } from "src/types";
import { assert, isReanimatedSharedValue } from "src/utils";
import { useDndContext } from "../DndContext";

export type UseDroppableOptions = { id: UniqueIdentifier; data?: Data; disabled?: boolean };

/**
 * useDroppable is a custom hook that provides functionality for making a component droppable within a drag and drop context.
 *
 * @function
 * @example
 * const { setNodeRef, setNodeLayout, activeId, draggableState } = useDroppable({ id: 'droppable-1' });
 *
 * @param {object} options - The options that define the behavior of the droppable component.
 * @param {string} options.id - A unique identifier for the droppable component.
 * @param {object} [options.data={}] - Optional data associated with the droppable component.
 * @param {boolean} [options.disabled=false] - A flag that indicates whether the droppable component is disabled.
 *
 * @returns {object} Returns an object with properties and methods related to the droppable component.
 * @property {Function} setNodeRef - A function that can be used to set the ref of the droppable component.
 * @property {Function} setNodeLayout - A function that handles the layout event of the droppable component.
 * @property {string} activeId - The unique identifier of the currently active droppable component.
 * @property {object} draggableState - An object representing the current state of the draggable component within the context.
 */
export const useDroppable = ({ id, data = {}, disabled = false }: UseDroppableOptions) => {
  const { droppableLayouts, droppableOptions, droppableActiveId, containerRef, draggableState } =
    useDndContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [node, setNodeRef] = useNodeRef<NativeElement, any>();
  //            ^?
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sharedData = isReanimatedSharedValue(data) ? data : useLatestSharedValue(data);

  const layout = useSharedValue<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useAnimatedReaction(
    () => disabled,
    (next, prev) => {
      if (next !== prev) {
        droppableOptions.value[id].disabled = disabled;
      }
    },
    [disabled],
  );

  useLayoutEffect(() => {
    const runLayoutEffect = () => {
      "worklet";
      droppableLayouts.value[id] = layout;
      droppableOptions.value[id] = { id, data: sharedData, disabled };
    };
    runOnUI(runLayoutEffect)();
    return () => {
      const runLayoutEffect = () => {
        "worklet";
        delete droppableLayouts.value[id];
        delete droppableOptions.value[id];
      };
      // if(node && node.key === key)
      runOnUI(runLayoutEffect)();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayout: ViewProps["onLayout"] = () => {
    assert(containerRef.current);
    node.current?.measureLayout(containerRef.current, (x, y, width, height) => {
      layout.value = { x, y, width, height };
    });
  };

  return { setNodeRef, setNodeLayout: onLayout, activeId: droppableActiveId, draggableState };
};
