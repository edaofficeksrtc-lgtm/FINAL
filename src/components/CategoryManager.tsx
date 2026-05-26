import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilIcon, TrashIcon, FolderIcon, TagsIcon } from 'lucide-react';

export function CategoryManager({ categories, categoryGroups, onRefresh }: { categories: any[], categoryGroups: any[], onRefresh: () => void }) {
  const [filterGroup, setFilterGroup] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', group: '', department: '', categoryType: '', transferType: '', seniorityType: '', isActive: true
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '', color: '#3b82f6', displayOrder: 1 });

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mergeSourceIds.length === 0 || !mergeTargetId) return alert("Select sources and target");
    await fetch('/api/categories/merge', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ sourceIds: mergeSourceIds, targetId: mergeTargetId })
    });
    setIsMergeModalOpen(false);
    setMergeSourceIds([]);
    setMergeTargetId('');
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Are you sure you want to delete this category? Soft delete will be applied if it is in use.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', group: '', department: '', categoryType: '', transferType: '', seniorityType: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsModalOpen(false);
    onRefresh();
  };

  const handleGroupDelete = async (id: string) => {
    if(!confirm('Are you sure you want to delete this group? Categories in this group will be unassigned.')) return;
    await fetch(`/api/category-groups/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleGroupEdit = (group: any) => {
    setEditingGroup(group);
    setGroupFormData(group);
    setIsGroupModalOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingGroup ? `/api/category-groups/${editingGroup.id}` : '/api/category-groups';
    const method = editingGroup ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupFormData)
    });
    setIsGroupModalOpen(false);
    onRefresh();
  };

  const filteredCategories = categories.filter(c => {
    const groupMatch = filterGroup === 'all' || c.group === filterGroup;
    const searchMatch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.code && c.code.toLowerCase().includes(search.toLowerCase()));
    return groupMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Category Management</CardTitle>
          <CardDescription>Create, edit, group and sort employee categories and master data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="w-full mt-2">
            <TabsList className="grid w-[400px] grid-cols-2 mb-6">
              <TabsTrigger value="categories"><TagsIcon className="w-4 h-4 mr-2"/> Categories ({categories.length})</TabsTrigger>
              <TabsTrigger value="groups"><FolderIcon className="w-4 h-4 mr-2"/> Category Groups ({categoryGroups.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="categories">
              <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Input placeholder="Search category by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm" />
                  <Select value={filterGroup} onValueChange={setFilterGroup}>
                    <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="All Groups" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {categoryGroups.map(g => (
                        <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsMergeModalOpen(true)}>Merge</Button>
                  <Button onClick={handleCreate} className="whitespace-nowrap">+ Add Category</Button>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Transfer Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.code}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-gray-50">{c.group || 'Unassigned'}</Badge></TableCell>
                        <TableCell>{c.department}</TableCell>
                        <TableCell>{c.transferType}</TableCell>
                        <TableCell>
                          {c.isActive ? <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge> : <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-blue-500"><PencilIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-red-500"><TrashIcon className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCategories.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-gray-500">No categories found matching filters.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="groups">
              <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingGroup(null); setGroupFormData({name: '', description: '', color: '#3b82f6', displayOrder: 1}); setIsGroupModalOpen(true); }}>+ Create Group</Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Color Theme</TableHead>
                      <TableHead>Used In Categories</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryGroups.map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>{g.description}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <div className="w-4 h-4 rounded-full" style={{backgroundColor: g.color}}></div>
                             <span className="text-sm font-mono text-gray-500">{g.color}</span>
                           </div>
                        </TableCell>
                        <TableCell>{categories.filter(c => c.group === g.name).length} Categories</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleGroupEdit(g)} className="text-blue-500"><PencilIcon className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleGroupDelete(g.id)} className="text-red-500"><TrashIcon className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold">{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <button className="text-gray-500 hover:text-gray-700 font-bold" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category Code</label>
                  <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. MECH" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Group</label>
                  <Select value={formData.group} onValueChange={val => setFormData({...formData, group: val})}>
                    <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categoryGroups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category Type</label>
                  <Select value={formData.categoryType} onValueChange={val => setFormData({...formData, categoryType: val})}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transfer Scope Engine</label>
                  <Select value={formData.transferType} onValueChange={val => setFormData({...formData, transferType: val})}>
                    <SelectTrigger><SelectValue placeholder="Transfer Scope" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="State">State level</SelectItem>
                      <SelectItem value="District">District level</SelectItem>
                      <SelectItem value="Unit">Unit level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seniority Execution</label>
                  <Select value={formData.seniorityType} onValueChange={val => setFormData({...formData, seniorityType: val})}>
                    <SelectTrigger><SelectValue placeholder="Seniority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="State">State Sr.</SelectItem>
                      <SelectItem value="District">District Sr.</SelectItem>
                      <SelectItem value="Unit">Unit Sr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Category is Active</label>
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Category</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold">{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button className="text-gray-500 hover:text-gray-700 font-bold" onClick={() => setIsGroupModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleGroupSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name *</label>
                <Input required value={groupFormData.name} onChange={e => setGroupFormData({...groupFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input value={groupFormData.description} onChange={e => setGroupFormData({...groupFormData, description: e.target.value})} placeholder="e.g. Technical staff for maintenance" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Theme</label>
                <div className="flex items-center gap-4">
                  <Input type="color" value={groupFormData.color} onChange={e => setGroupFormData({...groupFormData, color: e.target.value})} className="w-16 h-10 p-1" />
                  <span className="text-sm font-mono">{groupFormData.color}</span>
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button variant="outline" type="button" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Group</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold">Merge Categories</h2>
              <button className="text-gray-500 hover:text-gray-700 font-bold" onClick={() => setIsMergeModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleMergeSubmit} className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-500">Selected source categories will be marked inactive and their employees will be transferred to the target category.</p>
              <div>
                <label className="block text-sm font-medium mb-1">Source Categories to Merge</label>
                <Select value="" onValueChange={id => { if(!mergeSourceIds.includes(id)) setMergeSourceIds([...mergeSourceIds, id]); }}>
                  <SelectTrigger><SelectValue placeholder="Add Category to merge" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-3">
                  {mergeSourceIds.map(id => {
                     const cat = categories.find(c => c.id === id);
                     return <Badge key={id} variant="secondary" className="flex items-center gap-1">{cat?.name} <button type="button" onClick={() => setMergeSourceIds(mergeSourceIds.filter(i => i !== id))} className="text-xs ml-1 text-gray-500 hover:text-gray-700">&times;</button></Badge>
                  })}
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium mb-1">Target Category (Merge Into)</label>
                <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                  <SelectTrigger><SelectValue placeholder="Select Target" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => !mergeSourceIds.includes(c.id)).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button variant="outline" type="button" onClick={() => setIsMergeModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Confirm Merge</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
