
import { lua, lauxlib, lualib } from 'fengari-web';

export class LuaService {
  private L: any;
  private consoleOutput: string[] = [];
  private canvas?: HTMLCanvasElement;
  private canvasContext?: CanvasRenderingContext2D | null;

  constructor() {
    // Initialize Lua VM
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);

    // Set up custom print function for the console output
    this.setupCustomPrint();
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.setupLoveAPI();
  }

  private setupCustomPrint() {
    // Override print function to capture output
    const luaPrint = (L: any): number => {
      const n = lua.lua_gettop(L);
      const args = [];
      for (let i = 1; i <= n; i++) {
        args.push(lua.lua_tojsstring(L, i));
      }
      const text = args.join('\t');
      this.consoleOutput.push(text);
      console.log(`[Lua] ${text}`);
      return 0;
    };

    // Use lua.lua_pushcfunction instead of lua.lua_pushjs
    lua.lua_pushcfunction(this.L, luaPrint);
    lua.lua_setglobal(this.L, "print");
  }

  private setupLoveAPI() {
    if (!this.canvasContext || !this.canvas) return;

    const ctx = this.canvasContext;
    const canvas = this.canvas;

    // Create simple LÖVE-like API functions
    const setColorFn = (L: any): number => {
      const r = lua.lua_tonumber(L, 1);
      const g = lua.lua_tonumber(L, 2);
      const b = lua.lua_tonumber(L, 3);
      const a = lua.lua_tonumber(L, 4) || 1;
      ctx!.fillStyle = `rgba(${r * 255},${g * 255},${b * 255},${a})`;
      ctx!.strokeStyle = `rgba(${r * 255},${g * 255},${b * 255},${a})`;
      return 0;
    };
    
    const printFn = (L: any): number => {
      const text = lua.lua_tojsstring(L, 1);
      const x = lua.lua_tonumber(L, 2);
      const y = lua.lua_tonumber(L, 3);
      ctx!.fillText(text, x, y);
      return 0;
    };
    
    const circleFn = (L: any): number => {
      const mode = lua.lua_tojsstring(L, 1);
      const x = lua.lua_tonumber(L, 2);
      const y = lua.lua_tonumber(L, 3);
      const radius = lua.lua_tonumber(L, 4);
      ctx!.beginPath();
      ctx!.arc(x, y, radius, 0, Math.PI * 2);
      if (mode === "fill") {
        ctx!.fill();
      } else {
        ctx!.stroke();
      }
      return 0;
    };
    
    const rectangleFn = (L: any): number => {
      const mode = lua.lua_tojsstring(L, 1);
      const x = lua.lua_tonumber(L, 2);
      const y = lua.lua_tonumber(L, 3);
      const width = lua.lua_tonumber(L, 4);
      const height = lua.lua_tonumber(L, 5);
      if (mode === "fill") {
        ctx!.fillRect(x, y, width, height);
      } else {
        ctx!.strokeRect(x, y, width, height);
      }
      return 0;
    };
    
    const clearFn = (L: any): number => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      return 0;
    };
    
    const isDownFn = (L: any): number => {
      const key = lua.lua_tojsstring(L, 1);
      // Simplified, needs proper implementation
      // Fix: Use 1 for true and 0 for false when pushing boolean to Lua
      lua.lua_pushboolean(L, 0); // Push 0 for false
      return 1; // Return one value
    };

    // Create the love global table
    lua.lua_newtable(this.L);

    // Set up graphics table
    lua.lua_pushstring(this.L, "graphics");
    lua.lua_newtable(this.L);

    // Add graphics functions
    lua.lua_pushstring(this.L, "setColor");
    lua.lua_pushcfunction(this.L, setColorFn);
    lua.lua_settable(this.L, -3);
    
    lua.lua_pushstring(this.L, "print");
    lua.lua_pushcfunction(this.L, printFn);
    lua.lua_settable(this.L, -3);
    
    lua.lua_pushstring(this.L, "circle");
    lua.lua_pushcfunction(this.L, circleFn);
    lua.lua_settable(this.L, -3);
    
    lua.lua_pushstring(this.L, "rectangle");
    lua.lua_pushcfunction(this.L, rectangleFn);
    lua.lua_settable(this.L, -3);
    
    lua.lua_pushstring(this.L, "clear");
    lua.lua_pushcfunction(this.L, clearFn);
    lua.lua_settable(this.L, -3);

    // Add graphics table to love
    lua.lua_settable(this.L, -3);

    // Set up keyboard table
    lua.lua_pushstring(this.L, "keyboard");
    lua.lua_newtable(this.L);

    // Add keyboard functions
    lua.lua_pushstring(this.L, "isDown");
    lua.lua_pushcfunction(this.L, isDownFn);
    lua.lua_settable(this.L, -3);

    // Add keyboard table to love
    lua.lua_settable(this.L, -3);

    // Set love as global
    lua.lua_setglobal(this.L, "love");
  }

  public executeCode(code: string): { success: boolean, output: string[] } {
    this.consoleOutput = [];

    try {
      const status = lauxlib.luaL_dostring(this.L, code);

      if (status !== lua.LUA_OK) {
        const errorMsg = lua.lua_tojsstring(this.L, -1);
        lua.lua_pop(this.L, 1);
        this.consoleOutput.push(`Error: ${errorMsg}`);
        return { success: false, output: this.consoleOutput };
      }

      return { success: true, output: this.consoleOutput };
    } catch (e) {
      this.consoleOutput.push(`Runtime error: ${e}`);
      return { success: false, output: this.consoleOutput };
    }
  }

  public resetState() {
    // Clean up and re-initialize
    lua.lua_close(this.L);
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);

    this.setupCustomPrint();
    if (this.canvas) {
      this.setupLoveAPI();
    }

    this.consoleOutput = [];
  }
}

export const luaService = new LuaService();
