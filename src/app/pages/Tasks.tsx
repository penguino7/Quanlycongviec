import React, { useState, useRef, useEffect } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { Search, Filter, Plus, Edit2, Trash2, Calendar, Clock, AlertTriangle, ChevronDown, Check, GripVertical } from 'lucide-react';
import { Link } from 'react-router';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub-components ---

const SortableTaskCard = ({ task, updateTask, deleteTask }: { task: Task, updateTask: any, deleteTask: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all p-4 flex flex-col group relative"
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex justify-between items-start mb-3 gap-2 pr-6">
        <StatusBadge status={task.status} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if(confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                deleteTask(task.id);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{task.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{task.description}</p>

      <div className="mt-auto pt-3 border-t border-gray-50 dark:border-slate-800/50">
        <div className="flex flex-col gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>
          </span>
          <PriorityBadge priority={task.priority} showIcon={true} />
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ id, title, tasks, updateTask, deleteTask }: { id: string, title: string, tasks: Task[], updateTask: any, deleteTask: any }) => {
  return (
    <div className="flex flex-col min-w-[300px] w-full bg-gray-50/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/50">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
            />
          ))}
          {tasks.length === 0 && (
            <div className="h-24 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-gray-400 text-xs">
              Kéo thả vào đây
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// --- Main Page ---

export const Tasks = () => {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dragging over a column or another card
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine new status
    let newStatus: Task['status'] | null = null;
    
    // If dropped on a column directly
    if (['todo', 'in-progress', 'done'].includes(overId)) {
      newStatus = overId as Task['status'];
    } else {
      // If dropped on another card, get its status
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus && newStatus !== task.status) {
      updateTask(taskId, { status: newStatus });
    }
  };

  const priorityOptions = [
    { value: 'all', label: 'Mọi mức độ' },
    { value: 'high', label: 'Cao' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'low', label: 'Thấp' },
  ];

  const getSelectedPriorityLabel = () => {
    return priorityOptions.find(opt => opt.value === filterPriority)?.label || 'Mọi mức độ';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng công việc</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Quản lý theo phong cách Kanban Trello.</p>
        </div>
        <Link to="/add" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> 
          <span>Tạo thẻ mới</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-full w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Tìm thẻ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48" ref={priorityDropdownRef}>
            <button
              onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2.5 w-full text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span>{getSelectedPriorityLabel()}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPriorityDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterPriority(option.value as any);
                      setIsPriorityDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-between"
                  >
                    {option.label}
                    {filterPriority === option.value && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-h-[500px]">
            <KanbanColumn 
              id="todo" 
              title="Cần làm" 
              tasks={todoTasks} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
            />
            <KanbanColumn 
              id="in-progress" 
              title="Đang làm" 
              tasks={inProgressTasks} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
            />
            <KanbanColumn 
              id="done" 
              title="Hoàn thành" 
              tasks={doneTasks} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
            />
          </div>
        </DndContext>
      </div>
    </div>
  );
};