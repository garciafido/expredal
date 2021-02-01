import {flow} from "mobx";

export function flowed(
  _: any,
  _1: string,
  descriptor: TypedPropertyDescriptor<
    (...args: any[]) => Generator<any, any, any>
  >,
) {
  if (descriptor.value) {
    descriptor.value = flow(descriptor.value) as any;
  }
}

