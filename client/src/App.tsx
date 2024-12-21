import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import { ThemeProvider } from "./lib/theme-context";

function App() {
  return (
    <ThemeProvider>
      <Switch>
        <Route path="/" component={Home} />
      </Switch>
    </ThemeProvider>
  );
}

export default App;
