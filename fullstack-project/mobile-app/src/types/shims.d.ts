declare module 'react' {
	export type PropsWithChildren<P = {}> = P & { children?: unknown };
	export type Dispatch<A> = (value: A) => void;
	export type SetStateAction<S> = S | ((prevState: S) => S);

	export function createContext<T>(defaultValue: T): { Provider: any; Consumer: any };
	export function useContext<T>(context: any): T;
	export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
	export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
	export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

	const React: {
		createElement: any;
	};

	export default React;
}

declare module 'react/jsx-runtime' {
	export const jsx: any;
	export const jsxs: any;
	export const Fragment: any;
}

declare module 'react-native' {
	export const View: any;
	export const Text: any;
	export const TextInput: any;
	export const Pressable: any;
	export const ScrollView: any;
	export const SafeAreaView: any;
	export const ActivityIndicator: any;
	export const StyleSheet: any;
	export const Alert: any;
	export const AppRegistry: any;
	export const GestureHandlerRootView: any;
}

declare module '@react-native-async-storage/async-storage';
declare module '@react-native-firebase/app';
declare module '@react-native-firebase/messaging';
declare module 'socket.io-client';
