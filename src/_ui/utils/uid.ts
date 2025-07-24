export const uid = () =>
  Object.keys([...new Array(8)]).reduce(
    (a) =>
      a +
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1),
    "",
  );
