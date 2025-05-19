
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
    const luaPrint = (L: any) => {
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

    lua.lua_pushjs(this.L, luaPrint);
    lua.lua_setglobal(this.L, "print");
  }

  private setupLoveAPI() {
    if (!this.canvasContext || !this.canvas) return;
    
    const ctx = this.canvasContext;
    const canvas = this.canvas;
    
    // Create simple LÖVE-like API
    const love = {
      graphics: {
        setColor: (r: number, g: number, b: number, a = 1) => {
          ctx.fillStyle = `rgba(${r*255},${g*255},${b*255},${a})`;
          ctx.strokeStyle = `rgba(${r*255},${g*255},${b*255},${a})`;
        },
        print: (text: string, x: number, y: number) => {
          ctx.fillText(text, x, y);
        },
        circle: (mode: string, x: number, y: number, radius: number) => {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          if (mode === "fill") {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        },
        rectangle: (mode: string, x: number, y: number, width: number, height: number) => {
          if (mode === "fill") {
            ctx.fillRect(x, y, width, height);
          } else {
            ctx.strokeRect(x, y, width, height);
          }
        },
        clear: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
      keyboard: {
        isDown: (key: string) => {
          // This is simplified and needs proper keyboard handling
          return false;
        }
      }
    };
    
    // Register love API to Lua
    lua.lua_pushliteral(this.L, "love");
    lua.lua_newtable(this.L);
    
    // Set up graphics table
    lua.lua_pushliteral(this.L, "graphics");
    lua.lua_newtable(this.L);
    
    // Add graphics functions
    for (const [name, func] of Object.entries(love.graphics)) {
      lua.lua_pushliteral(this.L, name);
      lua.lua_pushjs(this.L, func);
      lua.lua_settable(this.L, -3);
    }
    
    // Add graphics table to love
    lua.lua_settable(this.L, -3);
    
    // Set up keyboard table
    lua.lua_pushliteral(this.L, "keyboard");
    lua.lua_newtable(this.L);
    
    // Add keyboard functions
    for (const [name, func] of Object.entries(love.keyboard)) {
      lua.lua_pushliteral(this.L, name);
      lua.lua_pushjs(this.L, func);
      lua.lua_settable(this.L, -3);
    }
    
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
