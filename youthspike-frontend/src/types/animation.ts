export interface IVariant {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  // Add more animation properties as needed
}

export interface ITransition {
  delay?: number;
  duration?: number;
  // Add more transition properties as needed
}

export interface IMotionConfig {
  initial?: IVariant;
  animate?: IVariant;
  exit?: IVariant;
  transition?: ITransition;
}
