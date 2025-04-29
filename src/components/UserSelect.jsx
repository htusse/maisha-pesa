import React, { useState, useEffect } from 'react';
import { searchUsers } from '../services/userService';
import { Combobox } from '@headlessui/react';
import { IoChevronDown, IoCheckmark } from 'react-icons/io5';
import debounce from 'lodash/debounce';

export default function UserSelect({ role, onSelect }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = debounce(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(searchQuery, role);
      const transformedResults = results.map(user => ({
        ...user,
        uid: user.id
      }));
      setUsers(transformedResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, role]);

  const handleSelect = (user) => {
    const transformedUser = {
      ...user,
      uid: user.id
    };
    setSelectedUser(transformedUser);
    onSelect(transformedUser);
  };

  return (
    <Combobox value={selectedUser} onChange={handleSelect}>
      <div className="relative">
        <div className="relative w-full">
          <Combobox.Input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Search by name or email..."
            displayValue={(user) => user?.fullName || ''}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <IoChevronDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>

        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {loading && (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Loading...
            </div>
          )}

          {!loading && users.length === 0 && query !== '' && (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              No users found.
            </div>
          )}

          {users.map((user) => (
            <Combobox.Option
              key={user.id}
              value={user}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-primary-600 text-white' : 'text-gray-900'
                }`
              }
            >
              {({ selected, active }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {user.fullName}
                  </span>
                  <span className="block truncate text-sm text-gray-500">
                    {user.email}
                  </span>
                  {selected ? (
                    <span
                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                        active ? 'text-white' : 'text-primary-600'
                      }`}
                    >
                      <IoCheckmark className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
} 