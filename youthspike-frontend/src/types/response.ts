export interface IResponse<DataType = any> {
  code?: number;
  success: boolean;
  message?: string;
  data: DataType;
}
