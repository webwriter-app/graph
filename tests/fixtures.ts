export const dot = `// a small weighted graph
graph Roads {
  node [shape=circle];
  rwth [label="Aachen"];
  k [label="Cologne"];
  d;
  rwth -- k [weight=70];
  k -- d [label="40"];
  rwth -- d -- k;
  solo;
}
`;

export const digraph = `digraph { a -> b -> c [label=3]; }`;

export const edgeList = `source,target,weight
Aachen,Cologne,70
"Cologne, Rhine",Duesseldorf,40
Hamburg,,
`;

export const matrix = `,A,B,C
A,,2,
B,2,,3
C,,3,
`;
