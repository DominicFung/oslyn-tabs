import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragHandle from "./draghandle";
import { Song } from "@/src/API";

export const DraggableTableRow = ({ row, children }: { row: Song, children: any }) => {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging
  } = useSortable({
    id: row.songId
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition
  }

  return (
    <>
      {isDragging ? (
        <tr ref={setNodeRef} style={style} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 opacity-50">
          <th>
            <DragHandle />
          </th>
        {children}
      </tr>
      ) : (
        <tr ref={setNodeRef} style={style} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
          <th {...attributes} {...listeners}>
            <DragHandle {...attributes} {...listeners} />
          </th>
          {children}
        </tr>
      )}
    </>
  );
};