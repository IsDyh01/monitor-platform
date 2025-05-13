const getStorage = (type: "local" | "session") => {
  if (type === "local") {
    const origin = localStorage;
    const storage = {
      getItem: (key: string) => {
        const value = origin.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      setItem: (key: string, value: any) => {
        origin.setItem(key, JSON.stringify(value));
      },
      clean: () => {
        origin.clear();
      },
    };

    return storage;
  } else {
    const origin = sessionStorage;
    const storage = {
      getItem: (key: string) => {
        const value = origin.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      setItem: (key: string, value: any) => {
        origin.setItem(key, JSON.stringify(value));
      },
      clean: () => {
        origin.clear();
      },
    };

    return storage;
  }
};

export default getStorage;
