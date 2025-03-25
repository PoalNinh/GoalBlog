import React, { createContext, useState, useContext } from 'react';

const PageActionsContext = createContext(null);

export const PageActionsProvider = ({ children }) => {
  const [pageActions, setPageActions] = useState([]);

  const registerPageActions = (actions) => {
    setPageActions(actions);
  };

  const clearPageActions = () => {
    setPageActions([]);
  };

  return (
    <PageActionsContext.Provider value={{ pageActions, registerPageActions, clearPageActions }}>
      {children}
    </PageActionsContext.Provider>
  );
};

export const usePageActions = () => useContext(PageActionsContext);