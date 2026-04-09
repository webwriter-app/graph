import { createContext } from "@lit/context";
import { PermissionsType } from "types";

export const permissionsContext = createContext<PermissionsType>(
	Symbol("permissions"),
);
