import React from 'react';

export const DataTable = ({ columns = [], data = [], keyExtractor = (item) => item.id || item._id, onRowClick }) => {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="table-row"
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, idx) => (
                <td key={idx} style={{ textAlign: col.align || 'left' }}>
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
