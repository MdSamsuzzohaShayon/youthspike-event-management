export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export interface IDocument {
  _id: string;
}
