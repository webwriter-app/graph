import { createContext } from "@lit/context";
import { PermissionsType } from "../model/types";

export const permissionsContext = createContext<PermissionsType>(
	Symbol("permissions"),
);
