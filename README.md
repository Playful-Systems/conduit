# Conduit

An axios like http client that uses fetch under the hood.

## Instantiating

```ts
import { Conduit } from '@packages/conduit';

const conduit = Conduit.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Requests

Conduit supports all the popular request methods.

### GET
```ts
const response = await conduit.get('/posts');
```

### POST
```ts
const response = await conduit.post('/posts', {
  title: 'foo',
  body: 'bar',
  userId: 1,
});
```

### PUT
```ts
const response = await conduit.put('/posts/1', {
  id: 1,
  title: 'foo',
  body: 'bar',
  userId: 1,
});
```

### PATCH
```ts
const response = await conduit.patch('/posts/1', {
  title: 'foo',
});
```

### DELETE
```ts
const response = await conduit.delete('/posts/1');
```