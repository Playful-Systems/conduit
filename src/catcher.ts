export const catcher = async <T>(promise: Promise<T>): Promise<T | Error> => {
  try {
    return await promise;
  } catch (error: any) {
    console.error(error);
    return new Error(error.message ?? "Unknown Error message");
  }
};
