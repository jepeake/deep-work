"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

type WorkType = {
  id: string;
  label: string;
};

interface WorkTypeSelectProps {
  workTypes: WorkType[];
  selectedWorkTypeId: string;
  setSelectedWorkTypeId: (id: string) => void;
  onAddWorkType?: (label: string) => void;
}

export function WorkTypeSelect({
  workTypes,
  selectedWorkTypeId,
  setSelectedWorkTypeId,
  onAddWorkType,
}: WorkTypeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [newWorkType, setNewWorkType] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Find the selected work type label
  const selectedWorkType = workTypes.find((type) => type.id === selectedWorkTypeId);

  // Set the first work type as selected if none is selected and work types are available
  React.useEffect(() => {
    if (!selectedWorkTypeId && workTypes.length > 0) {
      setSelectedWorkTypeId(workTypes[0].id);
    }
  }, [workTypes, selectedWorkTypeId, setSelectedWorkTypeId]);

  const handleAddWorkType = async () => {
    if (newWorkType.trim() && onAddWorkType) {
      await onAddWorkType(newWorkType.trim());
      setNewWorkType("");
      setShowAddForm(false);
    }
  };

  // Filter work types based on search query
  const filteredWorkTypes = React.useMemo(() => {
    if (!searchQuery) return workTypes;
    return workTypes.filter((type) => 
      type.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workTypes, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white dark:bg-black border-black/20 dark:border-white/20 text-black/80 dark:text-white/80"
        >
          <div className="flex items-center gap-2 truncate">
            <Tag className="h-4 w-4 shrink-0" />
            {selectedWorkType ? (
              <span className="border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">{selectedWorkType.label}</span>
            ) : "Select category..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[220px] p-0 bg-white dark:bg-black border-black/20 dark:border-white/20">
        <Command className="bg-white dark:bg-black">
          <CommandInput 
            placeholder="Search category..." 
            className="text-black dark:text-white" 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty className="py-2 text-center text-black/70 dark:text-white/70">
            No category found.
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {filteredWorkTypes.map((type) => (
              <div 
                key={type.id} 
                className={`flex items-center space-x-2 px-2 py-1.5 text-black dark:text-white text-sm rounded-sm cursor-pointer ${
                  selectedWorkTypeId === type.id ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                onClick={() => {
                  setSelectedWorkTypeId(type.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selectedWorkTypeId === type.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{type.label}</span>
              </div>
            ))}
          </CommandGroup>
          
          {onAddWorkType && (
            <div className="p-2 border-t border-black/10 dark:border-white/10">
              {!showAddForm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new category
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    value={newWorkType}
                    onChange={(e) => setNewWorkType(e.target.value)}
                    placeholder="New category name"
                    className="h-8 bg-white dark:bg-black text-black dark:text-white border-black/20 dark:border-white/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddWorkType();
                      }
                    }}
                  />
                  <div className="flex justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-black hover:bg-black/80 text-white"
                      onClick={() => {
                        handleAddWorkType();
                      }}
                      disabled={!newWorkType.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 